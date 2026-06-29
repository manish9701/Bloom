/**
 * Bloom — Recommendations Screen
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme } from "../lib/ThemeContext";
import {
  ArrowLeft, Images, Plus, Heart, ArrowsOut, Sparkle,
  ArrowRight, Swap, X, Bag,
} from "phosphor-react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, cardShadow, elevationShadow, ctaShadow } from "../lib/theme";
import { Shimmer, StatBar } from "./components/ui";
import {
  AIProduct,
  AIProductAlternative,
  AnalysisResult,
  generateComposite,
  generateProductImage,
  getAIProductRecommendations,
} from "../lib/aiService";
import { saveGlowUp } from "../lib/store";
import { isDemoMode } from "../lib/config";
import ImageViewer from "./components/ImageViewer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");
const CARD_W = (W - spacing.horizontal * 2 - 12) / 2;
const HERO_H = H * 0.46;

const BADGES: Record<string, { label: string; bg: string }> = {
  add:     { label: "NEW",     bg: colors.terracotta },
  replace: { label: "SWAP",   bg: colors.terracotta },
  upgrade: { label: "UPGRADE", bg: colors.forest },
};

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RecommendationsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    imageUri: string;
    budget: string;
    analysisJson: string;
    cropMapJson: string;
    userPrompt: string;
    initialSelectedIdsJson?: string;
  }>();

  const imageUri      = params.imageUri ?? "";
  const budget        = parseInt(params.budget ?? "10000", 10);
  const initialPrompt = params.userPrompt ?? "";
  const analysis      = params.analysisJson ? (JSON.parse(params.analysisJson) as AnalysisResult) : null;
  const initialSelectedIds: string[] | null = params.initialSelectedIdsJson
    ? JSON.parse(params.initialSelectedIdsJson)
    : null;

  // State
  const [products,          setProducts]          = useState<AIProduct[]>([]);
  const [selected,          setSelected]          = useState<Set<string>>(new Set());
  const [heroUri,           setHeroUri]           = useState<string>(imageUri);
  const [compositeUri,      setCompositeUri]       = useState<string | null>(null);
  const [showAfter,         setShowAfter]          = useState(false);
  const [loadingProducts,   setLoadingProducts]   = useState(true);
  const [loadingComposite,  setLoadingComposite]  = useState(false);
  const [shopSheet,         setShopSheet]         = useState<AIProduct | null>(null);
  const [compositeReady,    setCompositeReady]    = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [prompt,            setPrompt]            = useState(initialPrompt);
  const [promptInput,       setPromptInput]       = useState(initialPrompt);
  const [showPrompt,        setShowPrompt]        = useState(false);
  const [productImages,     setProductImages]     = useState<Record<string, string>>({});
  const [loadingProductImg, setLoadingProductImg] = useState<Set<string>>(new Set());
  const [viewerUri,         setViewerUri]         = useState<string | null>(null);
  const [viewerTags,        setViewerTags]        = useState<string[]>([]);
  const [variations,        setVariations]        = useState<string[]>([]);
  const [showVariations,    setShowVariations]    = useState(false);

  // Animations
  const heroFade      = useRef(new Animated.Value(1)).current;
  const listAnim      = useRef(new Animated.Value(0)).current;
  const shimmerAnim   = useRef(new Animated.Value(0)).current;
  const compositeAnim = useRef(new Animated.Value(0)).current;
  const saveScale     = useRef(new Animated.Value(1)).current;
  const gridOpacity   = useRef(new Animated.Value(1)).current;

  const lastCompositeIds = useRef<Set<string>>(new Set());
  const glowupId = useRef(`glowup-${Date.now()}-${Math.random().toString(36).slice(2)}`).current;

  const productsRef      = useRef<AIProduct[]>([]);
  const productImagesRef = useRef<Record<string, string>>({});
  const variationsRef    = useRef<string[]>([]);

  useEffect(() => {
    Animated.timing(gridOpacity, {
      toValue: compositeReady && !showAfter ? 0.4 : 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [showAfter, compositeReady, gridOpacity]);

  const animateSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(saveScale, { toValue: 1.3, duration: 75, useNativeDriver: true }),
      Animated.timing(saveScale, { toValue: 1, duration: 75, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    await doSave();
    setSaved(true);
    animateSave();
  };

  const isDirty = selected.size > 0 && (
    selected.size !== lastCompositeIds.current.size ||
    [...selected].some(id => !lastCompositeIds.current.has(id))
  );

  // Shimmer loop
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // No breathing animation — keep hero static while loading composite

  useEffect(() => { loadProducts(prompt); }, []);

  const loadProducts = async (userPrompt?: string) => {
    setLoadingProducts(true);
    listAnim.setValue(0);
    setProductImages({});
    productImagesRef.current = {};
    try {
      const prods = await getAIProductRecommendations(
        imageUri,
        analysis?.category ?? "Room",
        analysis?.vibe ?? "Modern",
        budget,
        userPrompt || undefined,
        analysis?.items,
        {},
        analysis?.spaceType ?? "indoor",
      );
      setProducts(prods);
      productsRef.current = prods;
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelected(new Set(initialSelectedIds));
      } else {
        setSelected(new Set(prods.map(p => p.id)));
      }
      lastCompositeIds.current = new Set();
      Animated.spring(listAnim, { toValue: 1, speed: 4, bounciness: 6, useNativeDriver: true }).start();
      eagerLoadProductImages(prods);
    } catch (e) {
      console.warn("loadProducts:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const eagerLoadProductImages = (prods: AIProduct[]) => {
    // Seed with any cropUri already available
    const imgs: Record<string, string> = {};
    prods.forEach(p => { if (p.cropUri) imgs[p.id] = p.cropUri; });
    setProductImages({ ...imgs });
    productImagesRef.current = { ...imgs };

    const missing = prods.filter(p => !imgs[p.id]);
    if (missing.length === 0) { setLoadingProductImg(new Set()); return; }

    const loadingIds = new Set(missing.map(p => p.id));
    setLoadingProductImg(loadingIds);

    // Concurrency-limited queue — max 2 in-flight at a time so first cards load fast
    const CONCURRENCY = 2;
    let idx = 0;

    const runNext = async () => {
      if (idx >= missing.length) return;
      const p = missing[idx++];
      if (!p) return;
      try {
        const uri = await generateProductImage(p.name, p.brand, p.category);
        if (uri) {
          productImagesRef.current = { ...productImagesRef.current, [p.id]: uri };
          setProductImages(prev => ({ ...prev, [p.id]: uri }));
        }
      } catch {
        // silently skip — card shows icon fallback
      } finally {
        setLoadingProductImg(prev => {
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        });
        runNext(); // pick up next item in queue
      }
    };

    // Start initial workers (up to CONCURRENCY)
    for (let i = 0; i < Math.min(CONCURRENCY, missing.length); i++) {
      runNext();
    }
  };

  const runComposite = useCallback(async (
    prods: AIProduct[], ids: Set<string>, userPrompt?: string,
  ) => {
    if (ids.size === 0) {
      crossfadeHero(imageUri);
      setCompositeReady(false);
      setCompositeUri(null);
      lastCompositeIds.current = new Set();
      return;
    }
    setLoadingComposite(true);
    compositeAnim.setValue(0);
    try {
      const chosen = prods.filter(p => ids.has(p.id));
      const result = await generateComposite(
        imageUri,
        chosen.map(p => ({ name: p.name, brand: p.brand, placementHint: p.placementHint, action: p.action })),
        analysis?.vibe ?? "Modern",
        userPrompt,
      );
      if (result.success) {
        crossfadeHero(result.compositeUri);
        setCompositeUri(result.compositeUri);
        setCompositeReady(true);
        setShowAfter(true);
        lastCompositeIds.current = new Set(ids);
        Animated.spring(compositeAnim, { toValue: 1, tension: 45, friction: 7, useNativeDriver: true }).start();

        const prevVars = variationsRef.current;
        const newVars = prevVars.includes(result.compositeUri) ? prevVars : [...prevVars, result.compositeUri];
        variationsRef.current = newVars;
        setVariations(newVars);

        // Auto-save after reimagine
        doSave({
          compositeUriOverride: result.compositeUri,
          variationsOverride: newVars,
          selectedOverride: ids,
          productsOverride: productsRef.current,
          productImagesOverride: productImagesRef.current,
          quiet: true,
        });
        setSaved(true);
      }
    } catch (e) {
      console.warn("composite:", e);
    } finally {
      setLoadingComposite(false);
    }
  }, [imageUri, analysis]);

  const crossfadeHero = (newUri: string) => {
    Animated.timing(heroFade, { toValue: 0.2, duration: 180, useNativeDriver: true }).start(() => {
      setHeroUri(newUri);
      Animated.timing(heroFade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    });
  };

  const toggleProduct = (product: AIProduct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(product.id) ? next.delete(product.id) : next.add(product.id);
      return next;
    });
    if (compositeReady) setShowAfter(false);
  };

  const handleReimagine = () => {
    if (isDemoMode) {
      Alert.alert(
        "Demo mode",
        "Add EXPO_PUBLIC_OPENROUTER_KEY to your .env file and restart the app to generate AI room composites and product photos.",
        [{ text: "OK" }],
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runComposite(products, selected, prompt);
  };

  const doSave = async (opts: {
    compositeUriOverride?: string;
    variationsOverride?: string[];
    productImagesOverride?: Record<string, string>;
    productsOverride?: AIProduct[];
    selectedOverride?: Set<string>;
    quiet?: boolean;
  } = {}) => {
    const compUri = opts.compositeUriOverride ?? compositeUri;
    if (!compUri) return;
    try {
      const sel = opts.selectedOverride ?? selected;
      const prods = opts.productsOverride ?? productsRef.current ?? products;
      const selectedProducts = prods.filter(p => sel.has(p.id));
      const imgs = opts.productImagesOverride ?? productImagesRef.current ?? productImages;
      const vars = opts.variationsOverride ?? variationsRef.current ?? variations;
      await saveGlowUp({
        id: glowupId,
        imageUri,
        compositeUri: compUri,
        variations: vars.length > 1 ? vars : undefined,
        label: analysis?.category ?? "My Space",
        vibe: analysis?.vibe ?? "Modern",
        score: Math.round(selectedProducts.reduce((s, p) => s + p.matchScore, 0) / (selectedProducts.length || 1)),
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        productCount: selectedProducts.length,
        products: selectedProducts,
        productImages: imgs,
        selectedIds: [...sel],
        analysisJson: params.analysisJson,
      });
      if (!opts.quiet) setSaved(true);
    } catch (e) {
      console.warn("[save]:", e);
    }
  };

  const applyPrompt = () => {
    const p = promptInput.trim();
    setPrompt(p);
    setShowPrompt(false);
    setSaved(false);
    setCompositeReady(false);
    setCompositeUri(null);
    setHeroUri(imageUri);
    lastCompositeIds.current = new Set();
    loadProducts(p);
  };

  const selectedProducts = products.filter(p => selected.has(p.id));
  const totalPrice = selectedProducts.reduce((s, p) => s + p.price, 0);
  const avgMatch   = selectedProducts.length
    ? Math.round(selectedProducts.reduce((s, p) => s + p.matchScore, 0) / selectedProducts.length) : 0;

  const currentHeroUri = showAfter && compositeReady ? heroUri : imageUri;

  const st = makeStyles(theme, isDark);

  // Open hero image viewer — show selected product names as tags
  const openHeroViewer = () => {
    setViewerUri(currentHeroUri);
    const tags = compositeReady && showAfter
      ? selectedProducts.map(p => `${p.brand} · ${p.name}`)
      : [];
    setViewerTags(tags);
  };

  // ── Card ──
  const renderCard = (item: AIProduct, index: number) => {
    const isSelected   = selected.has(item.id);
    const badge        = BADGES[item.action] ?? BADGES.add;
    const productImg   = productImages[item.id] ?? item.cropUri;
    const isLoadingImg = loadingProductImg.has(item.id);

    const cardSlide = listAnim.interpolate({
      inputRange: [0, 1], outputRange: [60 + index * 8, 0],
    });

    const dimmed = compositeReady && !isSelected;

    return (
      <Animated.View key={item.id} style={{
        opacity: listAnim,
        transform: [{ translateY: cardSlide }, { scale: dimmed ? 0.98 : 1 }],
        width: CARD_W,
      }}>
        <View style={[
          st.card,
          isSelected && { borderColor: colors.terracotta, borderWidth: 2 },
          dimmed && { opacity: 0.42 },
        ]}>
          {/* Image area — tap opens viewer */}
          <TouchableOpacity
            onPress={() => productImg
              ? (setViewerUri(productImg), setViewerTags(item.tags ?? []))
              : setShopSheet(item)
            }
            activeOpacity={0.9}
            style={st.cardImgWrap}
          >
            {isLoadingImg ? (
              <Animated.View style={[StyleSheet.absoluteFill, {
                opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
              }]}>
                <LinearGradient
                  colors={["#E8E2D9", "#D6CFC3", "#E8E2D9"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            ) : productImg ? (
              <Image
                source={{ uri: productImg }}
                style={st.cardImg}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.linen, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="image-outline" size={28} color={`${colors.sage}60`} />
              </View>
            )}
            <View style={[st.badge, { backgroundColor: badge.bg }]}>
              <Text style={st.badgeTxt}>{badge.label}</Text>
            </View>
            {/* Select toggle — top right */}
            <Pressable
              onPress={() => toggleProduct(item)}
              hitSlop={14}
              style={[st.selectRing, isSelected && { backgroundColor: colors.terracotta, borderColor: colors.terracotta }]}
            >
              {isSelected && <Text style={st.selectCheck}>✓</Text>}
            </Pressable>
          </TouchableOpacity>

          {/* Body — tap opens shop sheet */}
          <TouchableOpacity onPress={() => setShopSheet(item)} activeOpacity={0.85}>
            <View style={st.cardBody}>
              <Text style={[st.cardBrand, { color: colors.sage }]} numberOfLines={1}>{item.brand.toUpperCase()}</Text>
              <Text style={[st.cardName, { color: colors.forest }]} numberOfLines={2}>{item.name}</Text>
              <View style={st.priceRow}>
                <Text style={[st.cardPrice, { color: colors.terracotta }]}>₹{item.price.toLocaleString("en-IN")}</Text>
                {item.originalPrice && (
                  <Text style={[st.cardOrig, { color: colors.sage }]}>₹{item.originalPrice.toLocaleString("en-IN")}</Text>
                )}
              </View>
              <View style={st.matchRow}>
                <View style={st.matchTrack}>
                  <LinearGradient
                    colors={[colors.sage, colors.forest]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[st.matchFill, { width: `${item.matchScore}%` as any }]}
                  />
                </View>
                <Text style={st.matchPct}>{item.matchScore}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[st.root, { backgroundColor: colors.cream }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 0) + 100 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* ── HERO ── */}
        <View style={st.heroWrap}>
          <TouchableOpacity activeOpacity={0.92} onPress={openHeroViewer} style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: heroFade }]}>
              <Image source={{ uri: currentHeroUri }} style={st.heroImg} contentFit="cover" cachePolicy="memory-disk" />
            </Animated.View>
          </TouchableOpacity>

          <LinearGradient colors={["rgba(0,0,0,0.45)", "transparent"]} style={st.heroTopGrad} />
          <LinearGradient
            colors={["transparent", "rgba(244,239,230,0.97)"]}
            style={st.heroBotGrad}
          />

          {/* Tap to view hint */}
          <View style={[st.tapHint, { top: insets.top + 56 }]}>
            <ArrowsOut size={12} color={colors.white68} weight="light" />
            <Text style={st.tapHintTxt}>tap to view</Text>
          </View>

          <TouchableOpacity
            style={[st.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={18} color={colors.white} weight="light" />
          </TouchableOpacity>

          <View style={[st.headerRight, { top: insets.top + 10 }]}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <TouchableOpacity
                style={[st.headerBtn, saved && st.headerBtnSaved]}
                onPress={compositeReady ? handleSave : () => router.push("/(tabs)/gallery")}
                activeOpacity={0.8}
                hitSlop={8}
              >
                <Heart size={15} color={colors.white} weight={saved ? "fill" : "light"} />
                <Text style={st.headerBtnTxt}>
                  {saved ? "Saved!" : compositeReady ? "Save look" : "Gallery"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={st.headerBtnSquare}
              onPress={() => router.back()}
              activeOpacity={0.8}
              hitSlop={8}
            >
              <Plus size={18} color={colors.white} weight="bold" />
            </TouchableOpacity>
          </View>

          {loadingComposite && (
            <View style={[st.aiSpinner, { top: insets.top + 10 }]}>
              <Shimmer style={{ width: 16, height: 16, borderRadius: 8 }} />
              <Text style={st.aiSpinnerTxt}>AI styling…</Text>
            </View>
          )}

          {/* Room label — always at bottom-left, moves up when B/A toggle visible */}
          <View style={[st.heroLabel, compositeReady && st.heroLabelWithToggle]}>
            <Text style={st.heroCategory}>{analysis?.category ?? "Your Space"}</Text>
            {analysis?.vibe ? (
              <View style={[st.vibePill, { backgroundColor: `${colors.terracotta}DD` }]}>
                <Text style={st.vibePillTxt}>{analysis.vibe}</Text>
              </View>
            ) : null}
          </View>

          {compositeReady && (
            <View style={st.baToggleWrap}>
              <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
              <TouchableOpacity
                style={[st.baBtn, !showAfter && st.baBtnActiveBefore]}
                onPress={() => setShowAfter(false)}
              >
                <Text style={[st.baBtnTxt, !showAfter && st.baBtnTxtActiveBefore]}>Before</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.baBtn, showAfter && st.baBtnActiveAfter]}
                onPress={() => setShowAfter(true)}
              >
                <Text style={[st.baBtnTxt, showAfter && st.baBtnTxtActiveAfter]}>
                  {showAfter ? "✦ After" : "After"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {compositeReady && showAfter && (
            <View style={st.aiChip}>
              <Text style={st.aiChipTxt}>✦ AI Reimagined</Text>
            </View>
          )}
        </View>

        <StatBar
          stats={[
            { label: "Selected", value: `${selected.size}` },
            { label: totalPrice > budget ? "Over budget" : `of ₹${budget.toLocaleString("en-IN")}`, value: `₹${totalPrice.toLocaleString("en-IN")}` },
            { label: "Style fit", value: avgMatch ? `${avgMatch}%` : "–" },
          ]}
        />

        <View style={st.sectionHeader}>
          <Text style={st.sectionEyebrow}>CURATED FOR YOU</Text>
          <Text style={st.sectionTitle}>Shop the transformation</Text>
          <Text style={st.sectionSub}>Tap to shop · toggle rings to include in your look</Text>
        </View>

        {/* ── PRODUCT GRID ── */}
        {loadingProducts ? (
          <View style={st.gridContent}>
            {[0, 1, 2, 4].map((_, ri) => (
              <View key={ri} style={st.gridRow}>
                {[0, 1].map((ci) => (
                  <Animated.View key={ci} style={[st.shimmerCard, {
                    opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                  }]}>
                    <LinearGradient
                      colors={["#E8E2D9", "#D6CFC3", "#E8E2D9"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={st.shimmerImg}
                    />
                    <View style={st.shimmerLine1} />
                    <View style={st.shimmerLine2} />
                  </Animated.View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <Animated.View style={[st.gridContent, { opacity: gridOpacity }]}>
            {chunk(products, 2).map((row, ri) => (
              <View key={ri} style={st.gridRow}>
                {row.map((item, i) => renderCard(item, ri * 2 + i))}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
            ))}
            {compositeReady && !showAfter && (
              <View style={st.gridOverlay} pointerEvents="none">
                <Text style={st.gridOverlayTxt}>Switch to After to see your picks ✦</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* ── STYLE DIRECTION (separate, below products) ── */}
        {!loadingProducts && products.length > 0 && (
          <View style={{ paddingHorizontal: spacing.horizontal, marginTop: 4 }}>
            <Text style={st.sectionLbl}>
              Style direction <Text style={{ color: colors.sage, fontFamily: fonts.bodyRegular, textTransform: "none", letterSpacing: 0 }}>(optional)</Text>
            </Text>
            <View style={st.promptBar}>
              {showPrompt ? (
                <View style={st.promptInputRow}>
                  <Ionicons name="color-wand-outline" size={15} color={colors.sage} />
                  <TextInput
                    style={[st.promptInputField, { color: colors.forest }]}
                    placeholder="e.g. Japandi, cozy boho, dark academia..."
                    placeholderTextColor={colors.sage}
                    value={promptInput}
                    onChangeText={setPromptInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={applyPrompt}
                  />
                  <TouchableOpacity style={[st.promptApplyBtn, { backgroundColor: colors.terracotta }]} onPress={applyPrompt}>
                    <Ionicons name="arrow-forward" size={14} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowPrompt(false)} hitSlop={10}>
                    <Ionicons name="close" size={15} color={colors.sage} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={st.promptRow} onPress={() => setShowPrompt(true)}>
                  <Ionicons name="color-wand-outline" size={15} color={colors.terracotta} />
                  <Text style={[st.promptRowTxt, { color: prompt ? colors.forest : colors.sage }]} numberOfLines={1}>
                    {prompt || "Style direction (tap to customise)"}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.sage} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Variations button */}
        {variations.length > 0 && (
          <TouchableOpacity
            style={[st.variationsBtn, { backgroundColor: colors.white, borderColor: `${colors.forest}18`, marginHorizontal: 16, marginTop: 10 }]}
            onPress={() => setShowVariations(true)}
            activeOpacity={0.8}
          >
            <Text style={[st.variationCount, { backgroundColor: colors.terracotta }]}>{variations.length}</Text>
            <Text style={[st.variationsTxt, { color: colors.forest }]}>View all variations  →</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.sage} />
          </TouchableOpacity>
        )}

        {!loadingProducts && products.length > 0 && (
          <View style={[st.hint, { marginHorizontal: 16, marginTop: 14 }]}>
            <Ionicons name="sparkles" size={11} color={colors.terracotta} />
            <Text style={st.hintTxt}>
              ✦ Toggle pieces · tap Reimagine to see the transformation
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── STICKY REIMAGINE BUTTON ── */}
      {!loadingProducts && products.length > 0 && (
        <View style={[st.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <LinearGradient
            colors={["transparent", "rgba(244,239,230,0.92)", colors.cream]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <TouchableOpacity
            style={[st.reimagineBtn, {
              backgroundColor: isDirty ? colors.forest : colors.white,
              borderColor: isDirty ? colors.forest : `${colors.forest}20`,
              opacity: loadingComposite || selected.size === 0 ? 0.55 : 1,
              ...ctaShadow,
            }]}
            onPress={handleReimagine}
            disabled={loadingComposite || selected.size === 0}
            activeOpacity={0.85}
          >
            {loadingComposite ? (
              <Shimmer style={{ width: 20, height: 20, borderRadius: 10 }} />
            ) : null}
            <Text style={[st.reimagineTxt, {
              color: isDirty ? "#fff" : compositeReady ? colors.terracotta : colors.sage,
            }]}>
              {loadingComposite ? "Styling…" : compositeReady && !isDirty ? "Reimagined" : "Reimagine this  →"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SHOP SHEET ── */}
      <Modal visible={!!shopSheet} transparent animationType="slide" onRequestClose={() => setShopSheet(null)}>
        <Pressable style={st.overlay} onPress={() => setShopSheet(null)}>
          <View style={[st.sheet, { backgroundColor: colors.white }]} onStartShouldSetResponder={() => true}>
            {shopSheet && (
              <ShopSheet
                product={shopSheet}
                productImage={productImages[shopSheet.id] ?? null}
                loadingImage={loadingProductImg.has(shopSheet.id)}
                onClose={() => setShopSheet(null)}
                onViewImage={(uri) => { setShopSheet(null); setTimeout(() => setViewerUri(uri), 300); }}
                theme={theme}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* ── VARIATIONS MODAL ── */}
      <Modal visible={showVariations} transparent animationType="slide" onRequestClose={() => setShowVariations(false)}>
        <Pressable style={st.overlay} onPress={() => setShowVariations(false)}>
          <View style={[st.sheet, { backgroundColor: colors.white }]} onStartShouldSetResponder={() => true}>
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${colors.forest}18` }} />
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <Text style={{ color: colors.forest, fontSize: 18, fontFamily: fonts.displayBold }}>Variations</Text>
              <Text style={{ color: colors.sage, fontSize: 12, marginTop: 4, fontFamily: fonts.bodyRegular }}>
                {variations.length} composite{variations.length !== 1 ? "s" : ""} generated
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 24 }}>
              {variations.map((uri, i) => (
                <TouchableOpacity key={i} onPress={() => {
                  setShowVariations(false);
                  setTimeout(() => { setViewerUri(uri); setViewerTags([`Variation ${i + 1}`]); }, 300);
                }} activeOpacity={0.85}>
                  <Image source={{ uri }} style={{ width: 200, height: 150, borderRadius: 16 }} contentFit="cover" />
                  <View style={{ position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontFamily: fonts.bodyMedium }}>Variation {i + 1}</Text>
                  </View>
                  {uri === compositeUri && (
                    <View style={{ position: "absolute", top: 8, right: 8, backgroundColor: colors.terracotta, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 }}>
                      <Text style={{ color: "#fff", fontSize: 9, fontFamily: fonts.bodySemiBold }}>CURRENT</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── IMAGE VIEWER ── */}
      {viewerUri && (
        <ImageViewer
          visible={!!viewerUri}
          uri={viewerUri}
          onClose={() => { setViewerUri(null); setViewerTags([]); }}
          beforeUri={compositeReady ? imageUri : undefined}
          afterUri={compositeReady ? compositeUri ?? undefined : undefined}
          tags={viewerTags}
        />
      )}
    </View>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────
function StatItem({ label, value, theme, accent, overBudget }: {
  label: string; value: string; theme: any; accent?: boolean; overBudget?: boolean;
}) {
  const valueColor = overBudget ? colors.terracotta : accent ? colors.terracotta : colors.forest;
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ color: valueColor, fontSize: 18, fontFamily: fonts.displayBold, letterSpacing: -0.3 }}>{value}</Text>
      <Text style={{ color: overBudget ? colors.terracotta : colors.sage, fontSize: 10, marginTop: 1, fontFamily: fonts.bodyMedium, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

// ─── Shop Bottom Sheet ────────────────────────────────────────────────────────
function ShopSheet({
  product, productImage, loadingImage, onClose, onViewImage, theme,
}: {
  product: AIProduct;
  productImage: string | null;
  loadingImage: boolean;
  onClose: () => void;
  onViewImage: (uri: string) => void;
  theme: any;
}) {
  const badge = BADGES[product.action] ?? BADGES.add;
  const [activeAlt, setActiveAlt] = useState<AIProductAlternative | null>(null);

  const displayName  = activeAlt?.name  ?? product.name;
  const displayBrand = activeAlt?.brand ?? product.brand;
  const displayPrice = activeAlt?.price ?? product.price;
  const displayDesc  = activeAlt?.description ?? product.reason;

  return (
    <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: `${colors.forest}18` }} />
      </View>

      <TouchableOpacity
        activeOpacity={productImage ? 0.88 : 1}
        onPress={() => productImage && onViewImage(productImage)}
        style={[ss.imgHero, { backgroundColor: colors.linen }]}
      >
        {loadingImage ? (
          <View style={ss.imgPlaceholder}>
            <Shimmer style={{ width: "100%", height: "100%" }} />
            <Text style={[ss.imgGenTxt, { color: colors.sage, fontFamily: fonts.bodyMedium }]}>Generating product photo…</Text>
          </View>
        ) : productImage ? (
          <Image source={{ uri: productImage }} style={ss.heroImg} contentFit="contain" />
        ) : (
          <View style={[ss.imgPlaceholder, { backgroundColor: colors.linen }]} />
        )}
        <View style={[ss.heroBadge, { backgroundColor: badge.bg }]}>
          <Text style={ss.heroBadgeTxt}>{badge.label}</Text>
        </View>
        {productImage && (
          <View style={[ss.zoomHint, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <Text style={ss.zoomHintTxt}>tap to zoom</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={ss.header}>
        <Text style={[ss.brand, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>
          {displayBrand.toUpperCase()}
          {activeAlt && <Text style={[ss.altBadge, { color: colors.sage }]}> · ALTERNATIVE</Text>}
        </Text>
        <Text style={[ss.name, { color: colors.forest, fontFamily: fonts.bodySemiBold }]}>{displayName}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <Text style={[ss.price, { color: colors.terracotta, fontFamily: fonts.bodySemiBold }]}>
            ₹{displayPrice.toLocaleString("en-IN")}
          </Text>
          {!activeAlt && product.originalPrice && (
            <Text style={[ss.origPrice, { color: colors.sage, fontFamily: fonts.bodyRegular }]}>
              ₹{product.originalPrice.toLocaleString("en-IN")}
            </Text>
          )}
          {!activeAlt && product.originalPrice && (
            <View style={[ss.savePill, { backgroundColor: `${colors.sage}20` }]}>
              <Text style={[ss.saveTxt, { color: colors.terracotta, fontFamily: fonts.bodySemiBold }]}>
                {Math.round((1 - product.price / product.originalPrice) * 100)}% off
              </Text>
            </View>
          )}
        </View>
      </View>

      {(product.alternatives?.length ?? 0) > 0 && (
        <View style={[ss.altSection, { borderTopColor: `${colors.forest}18` }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 12, paddingHorizontal: 20 }}>
            <Ionicons name="swap-horizontal" size={11} color={colors.sage} />
            <Text style={[ss.sectionLabel, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>ALTERNATIVES</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            <TouchableOpacity
              onPress={() => setActiveAlt(null)}
              style={[ss.altChip, { backgroundColor: activeAlt === null ? colors.terracotta : colors.linen, borderColor: activeAlt === null ? colors.terracotta : `${colors.forest}18` }]}
            >
              <Text style={[ss.altChipBrand, { color: activeAlt === null ? "rgba(255,255,255,0.7)" : colors.sage, fontFamily: fonts.bodyMedium }]}>Original</Text>
              <Text style={[ss.altChipName, { color: activeAlt === null ? "#FFF" : colors.forest, fontFamily: fonts.displayMedium }]} numberOfLines={1}>{product.brand}</Text>
              <Text style={[ss.altChipPrice, { color: activeAlt === null ? "rgba(255,255,255,0.85)" : colors.terracotta, fontFamily: fonts.bodySemiBold }]}>₹{product.price.toLocaleString("en-IN")}</Text>
            </TouchableOpacity>
            {product.alternatives!.map((alt, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveAlt(alt)}
                style={[ss.altChip, { backgroundColor: activeAlt === alt ? colors.terracotta : colors.linen, borderColor: activeAlt === alt ? colors.terracotta : `${colors.forest}18` }]}
              >
                <Text style={[ss.altChipBrand, { color: activeAlt === alt ? "rgba(255,255,255,0.7)" : colors.sage, fontFamily: fonts.bodyMedium }]}>{alt.brand}</Text>
                <Text style={[ss.altChipName, { color: activeAlt === alt ? "#FFF" : colors.forest, fontFamily: fonts.displayMedium }]} numberOfLines={2}>{alt.name}</Text>
                <Text style={[ss.altChipPrice, { color: activeAlt === alt ? "rgba(255,255,255,0.85)" : colors.terracotta, fontFamily: fonts.bodySemiBold }]}>₹{alt.price.toLocaleString("en-IN")}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!activeAlt && (
        <View style={[ss.section, { borderTopColor: `${colors.forest}18` }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="star" size={11} color={colors.sage} />
              <Text style={[ss.sectionLabel, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>Style match</Text>
            </View>
            <Text style={[ss.sectionLabel, { color: colors.terracotta, fontFamily: fonts.bodySemiBold }]}>{product.matchScore}%</Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.linen, borderRadius: 2, overflow: "hidden" }}>
            <View style={{ width: `${product.matchScore}%` as any, height: "100%", backgroundColor: colors.sage, borderRadius: 2 }} />
          </View>
        </View>
      )}

      <View style={[ss.section, { borderTopColor: `${colors.forest}18` }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <Ionicons name="sparkles" size={11} color={colors.sage} />
          <Text style={[ss.sectionLabel, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>
            {activeAlt ? "About this alternative" : "Why it works"}
          </Text>
        </View>
        <Text style={[ss.sectionTxt, { color: colors.forest, fontFamily: fonts.bodyRegular }]}>{displayDesc}</Text>
      </View>

      {!activeAlt && (
        <View style={[ss.section, { borderTopColor: `${colors.forest}18` }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <Ionicons name="location" size={11} color={colors.sage} />
            <Text style={[ss.sectionLabel, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>Where to place it</Text>
          </View>
          <View style={[ss.placementBox, { backgroundColor: `${colors.sage}12`, borderColor: `${colors.sage}30` }]}>
            <Text style={[ss.sectionTxt, { color: colors.forest, fontFamily: fonts.bodyRegular }]}>{product.placementHint}</Text>
          </View>
        </View>
      )}

      {!activeAlt && product.tags.length > 0 && (
        <View style={[ss.section, { borderTopColor: `${colors.forest}18` }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <Ionicons name="pricetag" size={11} color={colors.sage} />
            <Text style={[ss.sectionLabel, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>Tags</Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {product.tags.map((t, i) => (
              <View key={i} style={[ss.tag, { backgroundColor: `${colors.sage}20` }]}>
                <Text style={[ss.tagTxt, { color: colors.terracotta, fontFamily: fonts.bodySemiBold }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginBottom: 16, marginTop: 4, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Ionicons name="bag" size={13} color={colors.sage} />
          <Text style={{ fontSize: 10, fontFamily: fonts.bodySemiBold, color: colors.sage, letterSpacing: 0.8, textTransform: "uppercase" }}>
            {activeAlt ? `Shop · ${activeAlt.name}` : "Buy now"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {activeAlt
            ? buildAltShopLinks(activeAlt).map(link => (
                <TouchableOpacity key={link.store}
                  style={ss.shopBtn}
                  onPress={() => Linking.openURL(link.url).catch(() => {})}
                >
                  <Text style={ss.shopBtnTxt}>{link.store}</Text>
                  <ArrowRight size={14} color={colors.cream} weight="light" />
                </TouchableOpacity>
              ))
            : product.shopLinks.map(link => (
                <TouchableOpacity key={link.store}
                  style={ss.shopBtn}
                  onPress={() => Linking.openURL(link.url).catch(() => {})}
                >
                  <Text style={ss.shopBtnTxt}>{link.store}</Text>
                  <ArrowRight size={14} color={colors.cream} weight="light" />
                </TouchableOpacity>
              ))
          }
        </View>
      </View>

      <TouchableOpacity
        style={[ss.closeBtn, { backgroundColor: colors.linen, borderColor: `${colors.forest}18` }]}
        onPress={onClose}
      >
        <Text style={[ss.closeTxt, { color: colors.sage, fontFamily: fonts.bodySemiBold }]}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    Lighting: "💡", Plants: "🌿", Textiles: "🛋️",
    Organisation: "📦", Furniture: "🪑", Decor: "🎨",
  };
  return map[cat] ?? "✨";
}

function buildAltShopLinks(alt: AIProductAlternative): { store: string; url: string }[] {
  const q = encodeURIComponent(`${alt.brand} ${alt.searchQuery}`);
  return [
    { store: "Amazon",   url: `https://www.amazon.in/s?k=${q}` },
    { store: "Flipkart", url: `https://www.flipkart.com/search?q=${q}` },
  ];
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(t: any, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1 },

    heroWrap:    { width: W, height: HERO_H, position: "relative", overflow: "hidden" },
    heroImg:     { width: "100%", height: "100%" },
    heroTopGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 110, pointerEvents: "none" },
    heroBotGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200, pointerEvents: "none" },

    tapHint: {
      position: "absolute", alignSelf: "center", left: (W - 100) / 2,
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: "rgba(0,0,0,0.32)",
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    },
    tapHintTxt: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontFamily: fonts.bodyMedium },

    backBtn: {
      position: "absolute", left: 18,
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: "rgba(28,58,46,0.55)",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
      alignItems: "center", justifyContent: "center",
    },
    headerRight: {
      position: "absolute", right: 18,
      flexDirection: "row", alignItems: "center", gap: 8,
    },
    headerBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill,
      borderWidth: 1, borderColor: colors.white15,
      backgroundColor: colors.glass,
    },
    headerBtnSaved: {
      backgroundColor: `${colors.terracotta}D9`,
      borderColor: `${colors.terracotta}80`,
    },
    headerBtnTxt: { color: "#FFF", fontSize: 13, fontFamily: fonts.bodyMedium },
    headerBtnSquare: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.glass,
      borderWidth: 1, borderColor: colors.white15,
      alignItems: "center", justifyContent: "center",
    },

    aiSpinner: {
      position: "absolute", alignSelf: "center", left: (W - 200) / 2,
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor:  colors.heroOverlay,
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill,
      borderWidth: 1, borderColor: "rgba(122,158,130,0.3)",
    },
    aiSpinnerTxt: { fontSize: 13, fontFamily: fonts.bodyMedium },

    heroLabel: {
      position: "absolute", bottom: 24, left: 20,
      flexDirection: "row", alignItems: "center", gap: 10,
    },
    heroLabelWithToggle: {
      bottom: 24, left: 20, right: 160,
    },
    heroCategory: {
      color: "#fff", fontSize: 22, fontFamily: fonts.displayBold, letterSpacing: -0.3,
      textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
    },
    vibePill:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
    vibePillTxt: { color: "#fff", fontSize: 11, fontFamily: fonts.bodyMedium },

    baToggleWrap: {
      position: "absolute", bottom: 18, alignSelf: "center",
      flexDirection: "row", padding: 4,
      backgroundColor: "rgba(18,32,24,0.55)",
      borderRadius: radius.pill,
      borderWidth: 1, borderColor: colors.white15,
      overflow: "hidden",
    },
    baBtn:          { paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", minWidth: 80 },
    baBtnActiveBefore: { backgroundColor: colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
    baBtnActiveAfter:  { backgroundColor: colors.forest, shadowColor: colors.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
    baBtnTxt:       { color: colors.white55, fontSize: 14, fontFamily: fonts.bodyMedium },
    baBtnTxtActiveBefore: { color: colors.charcoal, fontFamily: fonts.bodySemiBold },
    baBtnTxtActiveAfter:  { color: colors.cream, fontFamily: fonts.bodySemiBold },

    aiChip: {
      position: "absolute", top: 72, right: 16,
      backgroundColor: "rgba(28,58,46,0.55)",
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
      borderWidth: 1, borderColor: colors.glassBorder,
    },
    aiChipTxt: { color: colors.cream, fontSize: 11, fontFamily: fonts.bodyRegular },

    gridOverlay: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(244,239,230,0.35)",
    },
    gridOverlayTxt: {
      fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.sage,
      textAlign: "center", paddingHorizontal: 24,
    },

    statsFloat: {
      marginTop: -28, marginHorizontal: spacing.horizontal, marginBottom: 8, zIndex: 2,
    },
    statsBar: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: 18, paddingHorizontal: 16,
      backgroundColor: colors.white,
      borderRadius: radius.card,
      borderWidth: 1, borderColor: `${colors.forest}10`,
      ...elevationShadow,
    },
    statDivider: { width: 1, height: 36, marginHorizontal: 6, backgroundColor: `${colors.forest}14` },

    sectionHeader: { paddingHorizontal: spacing.horizontal, paddingTop: 20, paddingBottom: 10 },
    sectionEyebrow: {
      fontSize: 10, fontFamily: fonts.bodyMedium, letterSpacing: 2.5,
      color: colors.sage, textTransform: "uppercase",
    },
    sectionTitle:   { fontSize: 30, fontFamily: fonts.displayBold, letterSpacing: -0.6, marginTop: 4, color: colors.forest },
    sectionSub:     { fontSize: 13, fontFamily: fonts.bodyRegular, marginTop: 6, color: colors.sage },

    sectionLbl: {
      fontSize: 10, fontFamily: fonts.bodyMedium, textTransform: "uppercase",
      letterSpacing: 2, marginBottom: 8, color: colors.sage,
    },

    // Shimmer loading
    loadWrap: { alignItems: "center", paddingVertical: 60, gap: 14 },
    loadTxt:  { fontSize: 14, fontFamily: fonts.bodyRegular },
    shimmerCard: {
      width: CARD_W, height: 220, borderRadius: radius.card,
      backgroundColor: colors.linen, overflow: "hidden",
    },
    shimmerImg: { width: "100%", height: 140, borderRadius: 0 },
    shimmerLine1: { margin: 10, height: 10, borderRadius: 5, backgroundColor: `${colors.forest}18` },
    shimmerLine2: { marginHorizontal: 10, height: 10, borderRadius: 5, width: "60%", backgroundColor: `${colors.forest}10` },

    gridContent: { paddingHorizontal: spacing.horizontal, paddingTop: 14, position: "relative" },
    gridRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },

    card: {
      width: CARD_W, borderRadius: radius.card, overflow: "hidden",
      backgroundColor: colors.mist,
      borderWidth: 1, borderColor: `${colors.forest}12`,
      height: 272,
      ...elevationShadow,
    },
    cardImgWrap: {
      width: "100%", height: 152, position: "relative",
      backgroundColor: colors.linen,
      borderTopLeftRadius: radius.card - 1,
      borderTopRightRadius: radius.card - 1,
      overflow: "hidden",
    },
    cardImg:     { width: "100%", height: "100%" },
    cardImgFallback: {
      width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: colors.linen,
    },
    cardEmoji:   { fontSize: 32 },
    genTxt:      { fontSize: 10, fontFamily: fonts.bodyRegular },
    badge: {
      position: "absolute", top: 8, left: 8,
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.badge,
    },
    badgeTxt: { color: "#FFF", fontSize: 9, fontFamily: fonts.bodySemiBold, letterSpacing: 0.6 },
    selectRing: {
      position: "absolute", top: 8, right: 8,
      width: 24, height: 24, borderRadius: 12, borderWidth: 2,
      borderColor: "rgba(255,255,255,0.8)",
      backgroundColor: "rgba(0,0,0,0.22)",
      alignItems: "center", justifyContent: "center",
    },
    selectCheck: { color: "#FFF", fontSize: 13, fontFamily: fonts.bodySemiBold },
    cardBody:  { padding: 11, gap: 3 },
    cardBrand: { fontSize: 9, fontFamily: fonts.bodySemiBold, letterSpacing: 1, color: colors.sage },
    cardName:  { fontSize: 13, fontFamily: fonts.displayMedium, lineHeight: 17, color: colors.forest },
    priceRow:  { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 3 },
    cardPrice: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.terracotta },
    cardOrig:  { fontSize: 10, textDecorationLine: "line-through", fontFamily: fonts.bodyRegular },
    matchRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
    matchTrack: { flex: 1, height: 3, borderRadius: 1.5, overflow: "hidden", backgroundColor: colors.linen },
    matchFill:  { height: "100%", borderRadius: 1.5, backgroundColor: colors.sage },
    matchPct:   { fontSize: 9, fontFamily: fonts.bodyMedium, width: 28, textAlign: "right", color: colors.sage },

    // Style direction
    promptBar: {
      borderRadius: radius.input, borderWidth: 1,
      borderColor: `${colors.forest}20`,
      backgroundColor: colors.white,
    },
    promptInputRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    promptInputField: { flex: 1, fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.forest },
    promptApplyBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.terracotta,
      alignItems: "center", justifyContent: "center",
    },
    promptRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 14,
    },
    promptRowTxt: { flex: 1, fontSize: 14, fontFamily: fonts.bodyRegular },

    // Variations
    variationsBtn: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 13,
      borderRadius: radius.card, borderWidth: 1,
      borderColor: `${colors.forest}18`,
      backgroundColor: colors.white,
    },
    variationCount: {
      color: "#fff", fontSize: 11, fontFamily: fonts.bodySemiBold,
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, overflow: "hidden",
      backgroundColor: colors.terracotta,
    },
    variationsTxt: { flex: 1, fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.forest },

    hint: {
      flexDirection: "row", alignItems: "center", gap: 7,
      padding: 12, borderRadius: radius.input, borderWidth: 1, marginBottom: 8,
      backgroundColor: `${colors.terracotta}14`,
      borderColor: `${colors.terracotta}30`,
    },
    hintTxt: { fontSize: 12, fontFamily: fonts.bodyMedium, flex: 1, color: colors.terracotta },

    // Sticky Reimagine button
    stickyBar: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 12,
      backgroundColor: "transparent",
    },
    reimagineBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, paddingVertical: 16, borderRadius: radius.pill, borderWidth: 1.5,
      shadowColor: colors.forest, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
    },
    reimagineTxt: { fontSize: 16, fontFamily: fonts.bodySemiBold, letterSpacing: 0.3 },

    // Modals
    overlay: { flex: 1, backgroundColor: "rgba(18,32,24,0.6)", justifyContent: "flex-end" },
    sheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%", overflow: "hidden", backgroundColor: colors.cream },
  });
}

// ─── Shop Sheet Styles ────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  imgHero: { width: "100%", height: 270, position: "relative", overflow: "hidden", backgroundColor: colors.linen },
  heroImg: { width: "100%", height: "100%" },
  imgPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  imgGenTxt: { fontSize: 13, textAlign: "center", fontFamily: fonts.bodyRegular },
  heroBadge: {
    position: "absolute", top: 14, left: 20,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.badge,
  },
  heroBadgeTxt: { color: "#FFF", fontSize: 11, fontFamily: fonts.bodySemiBold },
  zoomHint: {
    position: "absolute", bottom: 10, right: 14,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10,
  },
  zoomHintTxt: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontFamily: fonts.bodyMedium },
  header: { padding: 20, paddingBottom: 4, backgroundColor: colors.cream },
  brand:  { fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.bodySemiBold, color: colors.sage },
  altBadge: { fontSize: 9, fontFamily: fonts.bodyRegular },
  name:   { fontSize: 22, letterSpacing: -0.3, marginTop: 4, fontFamily: fonts.displayBold, color: colors.forest },
  price:  { fontSize: 24, fontFamily: fonts.displayBold, color: colors.terracotta },
  origPrice: { fontSize: 14, textDecorationLine: "line-through", fontFamily: fonts.bodyRegular },
  savePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  saveTxt:  { fontSize: 11, fontFamily: fonts.bodySemiBold },
  section: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: `${colors.forest}12` },
  altSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: `${colors.forest}12` },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: fonts.bodyMedium, color: colors.sage },
  altCount: { fontSize: 10, fontFamily: fonts.bodyRegular },
  sectionTxt: { fontSize: 14, lineHeight: 23, fontFamily: fonts.bodyRegular, color: colors.forest },
  placementBox: { padding: 13, borderRadius: radius.input, borderWidth: 1, backgroundColor: `${colors.sage}10`, borderColor: `${colors.sage}30` },
  altChip: { borderRadius: radius.input, borderWidth: 1, padding: 10, width: 120, gap: 2 },
  altChipBrand: { fontSize: 9, letterSpacing: 0.8, fontFamily: fonts.bodySemiBold },
  altChipName:  { fontSize: 12, fontFamily: fonts.displayMedium },
  altChipPrice: { fontSize: 13, marginTop: 2, fontFamily: fonts.bodySemiBold },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: `${colors.sage}18` },
  tagTxt: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.forest },
  shopBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: radius.input,
    backgroundColor: colors.forest,
  },
  shopBtnTxt: { color: colors.cream, fontSize: 14, fontFamily: fonts.bodySemiBold },
  closeBtn: {
    marginHorizontal: 20, marginBottom: 24, marginTop: 4,
    paddingVertical: 14, borderRadius: radius.input, alignItems: "center", borderWidth: 1,
    borderColor: `${colors.forest}20`, backgroundColor: colors.linen,
  },
  closeTxt: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.forest },
});
