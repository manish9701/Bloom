/**
 * Bloom — Home / Curate Screen
 * Premium redesign v2.0 — Cormorant Garamond + DM Sans
 * Screens: Homepage → Scanning → Analysis + Budget
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image as RNImage,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
  FlatList,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Easing,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../lib/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Images, Camera, ArrowRight, Sparkle, ArrowsOut, Warning, Plus } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import {
  analyzeSpace,
  AnalysisResult,
  cropDetectedItems,
} from "../../lib/aiService";
import { getGallery } from "../../lib/store";
import { GlowUp } from "../../lib/mockData";
import ImageViewer from "../components/ImageViewer";
import BloomWordmark from "../components/BloomWordmark";
import GalleryNavPill from "../components/GalleryNavPill";
import { Shimmer, Chip, GrainOverlay, AmbientDots, FadeUp } from "../components/ui";
import { colors, fonts, radius, spacing, cardShadow, elevationShadow, primaryButtonShadow } from "../../lib/theme";
import { isDemoMode } from "../../lib/config";

const { width: W, height: H } = Dimensions.get("window");
const SLIDER_W = W - 80;
const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;

function snapBudget(v: number) {
  if (v < 2000) return Math.round(v / 500) * 500;
  if (v < 10000) return Math.round(v / 1000) * 1000;
  return Math.round(v / 5000) * 5000;
}
function fmtBudget(b: number) {
  return b >= 1000 ? `₹${(b / 1000).toFixed(b % 1000 === 0 ? 0 : 1)}k` : `₹${b}`;
}

// ─── Budget Slider ────────────────────────────────────────────────────────────
function BudgetSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = (value - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET);
  const thumbX = useRef(new Animated.Value(pct * SLIDER_W)).current;
  const currentVal = useRef(value);
  const lastHaptic = useRef(value);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      (thumbX as any).setOffset((thumbX as any).__getValue());
      thumbX.setValue(0);
    },
    onPanResponderMove: (_, gs) => {
      const raw = Math.max(0, Math.min(SLIDER_W, (thumbX as any)._offset + gs.dx));
      thumbX.setValue(raw - (thumbX as any)._offset);
      const nv = snapBudget(MIN_BUDGET + (raw / SLIDER_W) * (MAX_BUDGET - MIN_BUDGET));
      if (nv !== currentVal.current) {
        currentVal.current = nv;
        if (nv !== lastHaptic.current) {
          lastHaptic.current = nv;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onChange(nv);
      }
    },
    onPanResponderRelease: (_, gs) => {
      thumbX.flattenOffset();
      const raw = Math.max(0, Math.min(SLIDER_W, (thumbX as any).__getValue()));
      thumbX.setValue(raw);
      onChange(snapBudget(MIN_BUDGET + (raw / SLIDER_W) * (MAX_BUDGET - MIN_BUDGET)));
    },
  })).current;

  return (
    <View style={sl.wrap}>
      {/* Budget display */}
      <View style={sl.budgetDisplay}>
        <Text style={sl.budgetVal}>{fmtBudget(value)}</Text>
        <Text style={sl.budgetSub}>of {fmtBudget(MAX_BUDGET)} max</Text>
      </View>
      {/* Track */}
      <View style={sl.trackWrap}>
        <View style={sl.track}>
          {/* fill: scaleX from left — translateX offsets the scale-center to left edge */}
          <Animated.View style={[sl.fill, {
            transform: [
              { translateX: thumbX.interpolate({ inputRange: [0, SLIDER_W], outputRange: [-SLIDER_W / 2, 0], extrapolate: "clamp" }) },
              { scaleX: thumbX.interpolate({ inputRange: [0, SLIDER_W], outputRange: [0, 1], extrapolate: "clamp" }) },
            ],
          }]} />
          <Animated.View
            style={[sl.thumb, {
              transform: [{ translateX: thumbX.interpolate({ inputRange: [0, SLIDER_W], outputRange: [0, SLIDER_W], extrapolate: "clamp" }) }],
            }]}
            {...pan.panHandlers}
          />
        </View>
        <View style={sl.rangeLabels}>
          <Text style={sl.rangeLabel}>{fmtBudget(MIN_BUDGET)}</Text>
          <Text style={sl.rangeLabel}>{fmtBudget(MAX_BUDGET)}</Text>
        </View>
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap:         { gap: 16 },
  budgetDisplay:{ alignItems: "center" },
  budgetVal:    { fontSize: 36, fontFamily: fonts.displayBold, color: colors.forest, letterSpacing: -0.5 },
  budgetSub:    { fontSize: 12, fontFamily: fonts.bodyLight, color: colors.sage, marginTop: 2 },
  trackWrap:    { gap: 8, paddingHorizontal: 4 },
  track: {
    height: 6, borderRadius: 100, width: SLIDER_W, alignSelf: "center",
    backgroundColor: colors.linen, position: "relative",
  },
  fill: {
    position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 100,
    width: SLIDER_W, // full width, scaleX controls visible portion
    backgroundColor: colors.sage,
  },
  thumb: {
    position: "absolute", top: -10, left: -13,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.white, borderWidth: 2, borderColor: colors.forest,
    shadowColor: colors.forest, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  rangeLabels: { flexDirection: "row", justifyContent: "space-between" },
  rangeLabel:  { fontSize: 12, fontFamily: fonts.bodyLight, color: colors.sage },
});

// ─── Style chips ──────────────────────────────────────────────────────────────
const STYLE_CHIPS = ["Japandi", "Warm Boho", "Modern Luxe", "Maximalist", "Scandi", "Dark Academia"];

function StyleChips({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
      {STYLE_CHIPS.map(chip => (
        <Chip
          key={chip}
          label={chip}
          active={selected === chip}
          onPress={() => onSelect(selected === chip ? "" : chip)}
        />
      ))}
    </ScrollView>
  );
}

// ─── Recent Curations Strip ───────────────────────────────────────────────────
function RecentCurations({ items, onTap }: { items: GlowUp[]; onTap: (g: GlowUp) => void }) {
  if (items.length === 0) return null;
  return (
    <View style={rc.wrap}>
      <Text style={rc.label}>Recent curations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
        {items.slice(0, 3).map(g => (
          <TouchableOpacity key={g.id} activeOpacity={0.82} onPress={() => onTap(g)} style={rc.card}>
            <Image source={{ uri: g.compositeUri ?? g.imageUri }} style={rc.img} contentFit="cover" />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
            <View style={rc.meta}>
              <Text style={rc.metaVibe} numberOfLines={1}>{g.vibe}</Text>
              <Text style={rc.metaDate}>{g.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const rc = StyleSheet.create({
  wrap:     { paddingHorizontal: spacing.horizontal, marginBottom: 22 },
  label:    { fontSize: 10, fontFamily: fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 2.5, color: "rgba(244,239,230,0.55)", marginBottom: 12 },
  card:     { width: 118, height: 88, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.glassBorder, position: "relative", ...cardShadow },
  img:      { width: "100%", height: "100%" },
  meta:     { position: "absolute", bottom: 6, left: 7, right: 7 },
  metaVibe: { color: "#fff", fontSize: 9, fontFamily: fonts.bodySemiBold },
  metaDate: { color: "rgba(255,255,255,0.6)", fontSize: 8, fontFamily: fonts.bodyRegular },
});

// ─── Scanning overlay (Screen 2) ──────────────────────────────────────────────
function ScanOverlay({ imageHeight }: { imageHeight: number }) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.1)).current;
  const chipAnims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const [activeChip, setActiveChip] = useState(0);

  useEffect(() => {
    // Scan line
    const scanLoop = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.linear })
    );
    scanLoop.start();

    // Corner scale
    Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Chip sequence
    const chipInterval = setInterval(() => {
      setActiveChip(p => (p + 1) % 3);
    }, 1200);

    return () => { scanLoop.stop(); clearInterval(chipInterval); };
  }, []);

  const CHIPS = [{ icon: "🌿", label: "Vibe" }, { icon: "🎨", label: "Palette" }, { icon: "📦", label: "Items" }];

  return (
    <>
      {/* Grid lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`h${i}`} style={[scan.gridH, { top: `${(i + 1) * 14}%` as any }]} />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={`v${i}`} style={[scan.gridV, { left: `${(i + 1) * 14}%` as any }]} />
      ))}

      {/* Scan line */}
      <Animated.View style={[scan.scanLine, {
        transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, imageHeight] }) }],
      }]} />

      {/* Corner brackets */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <Animated.View key={i} style={[scan.corner, pos, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[scan.cornerH, i < 2 ? { top: 0 } : { bottom: 0 }]} />
          <View style={[scan.cornerV, i % 2 === 0 ? { left: 0 } : { right: 0 }]} />
        </Animated.View>
      ))}

      {/* Chip row */}
      <View style={scan.chips}>
        {CHIPS.map((chip, i) => (
          <View key={i} style={[scan.chip, activeChip === i && scan.chipActive]}>
            <Text style={{ fontSize: 10 }}>{chip.icon}</Text>
            <Text style={[scan.chipTxt, activeChip === i && scan.chipTxtActive]}>{chip.label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}
const scan = StyleSheet.create({
  gridH:       { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  gridV:       { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  scanLine:    { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: colors.sage + "CC" },
  corner:      { position: "absolute", width: 20, height: 20 },
  cornerH:     { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: colors.sage },
  cornerV:     { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: colors.sage },
  chips:       { position: "absolute", bottom: -44, left: 0, right: 0, flexDirection: "row", gap: 8, justifyContent: "center" },
  chip:        { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: colors.sage, backgroundColor: "transparent" },
  chipActive:  { backgroundColor: colors.sage },
  chipTxt:     { fontSize: 11, fontFamily: fonts.bodyRegular, color: colors.sage },
  chipTxtActive:{ color: colors.white },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri]   = useState<string | null>(null);
  const [imgRatio, setImgRatio]   = useState<number>(4 / 3);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis]   = useState<AnalysisResult | null>(null);
  const [cropMap, setCropMap]     = useState<Record<string, string>>({});
  const [budget, setBudget]       = useState(10000);
  const [prompt, setPrompt]       = useState("");
  const [selectedChip, setSelectedChip] = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [recentCurations, setRecentCurations] = useState<GlowUp[]>([]);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const heroFade = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const shimmerTxt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTxt, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerTxt, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, []);

  useFocusEffect(useCallback(() => {
    getGallery().then(g => setRecentCurations(g.slice(0, 3)));
  }, []));

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError("Gallery access needed."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.88, exif: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.width && asset.height) setImgRatio(asset.width / asset.height);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleImage(asset.uri);
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError("Camera access needed."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.88 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.width && asset.height) setImgRatio(asset.width / asset.height);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleImage(asset.uri);
  }, []);

  const handleImage = async (uri: string) => {
    setError(null);
    setImageUri(uri);
    setAnalysis(null);
    setCropMap({});
    setAnalyzing(true);
    try {
      const result = await analyzeSpace(uri);
      setAnalysis(result);
      cropDetectedItems(uri, result.items).then(c => setCropMap(c)).catch(() => {});
    } catch {
      setError("Analysis failed. Try again.");
    }
    setAnalyzing(false);
  };

  const goToProducts = () => {
    if (!imageUri || !analysis) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(ctaScale, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.timing(ctaScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      router.push({
        pathname: "/recommendations",
        params: {
          imageUri,
          budget: budget.toString(),
          analysisJson: JSON.stringify(analysis),
          cropMapJson: JSON.stringify(cropMap),
          userPrompt: (prompt.trim() || selectedChip),
        },
      });
    });
  };

  const openDetail = (g: GlowUp) => {
    router.push({ pathname: "/gallery-detail", params: { id: g.id } });
  };

  const reset = () => {
    setImageUri(null); setAnalysis(null); setCropMap({});
    setError(null); setPrompt(""); setSelectedChip("");
  };

  const trySampleRoom = () => {
    const source = RNImage.resolveAssetSource(require("../../assets/hero-room.png"));
    if (!source?.uri) {
      setError("Sample image unavailable.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleImage(source.uri);
  };

  // ─── SCREEN 1: Homepage — editorial hero ───────────────────────────────────
  if (!imageUri) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.forest }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: heroFade }]}>
          <Image
            source={require("../../assets/hero-bg.jpg")}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={["rgba(18,32,24,0.42)", "transparent", "rgba(18,32,24,0.90)"]}
            locations={[0, 0.38, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["#F4EFE6", "transparent"]}
            style={hp.topFade}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          />
          <GrainOverlay />
        </Animated.View>

        <AmbientDots />

        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: spacing.horizontal }}>
          <GalleryNavPill light />
        </SafeAreaView>

        <View style={[hp.bottom, { paddingBottom: insets.bottom + 32 }]}>
          <RecentCurations items={recentCurations} onTap={openDetail} />

          {isDemoMode && (
            <View style={hp.demoBanner}>
              <Text style={hp.demoBannerTxt}>
                Demo mode · add OpenRouter key in <Text style={hp.demoBannerBold}>.env</Text> for full AI
              </Text>
            </View>
          )}

          <FadeUp index={0}>
            <View style={hp.heroText}>
              <Text style={hp.eyebrow}>
                <Text style={{ color: colors.sage }}>✦</Text>  AI VIBE CURATOR
              </Text>
              <Text style={hp.title}>
                Your vibe,{"\n"}
                <Text style={hp.titleItalic}>reimagined.</Text>
              </Text>
              <Text style={hp.sub}>
                Curated picks for anything you love.{"\n"}Visualise the transformation.
              </Text>
            </View>
          </FadeUp>

          <FadeUp index={1}>
            <View style={hp.actions}>
              <Pressable
                style={({ pressed }) => [hp.btnPrimary, pressed && hp.btnPressed]}
                onPress={pickImage}
              >
                <Images size={20} color={colors.charcoal} weight="light" />
                <Text style={hp.btnPrimaryTxt}>Upload Photo</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [hp.btnSecondary, pressed && hp.btnPressed]}
                onPress={takePhoto}
              >
                <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
                <Camera size={20} color={colors.cream} weight="light" />
                <Text style={hp.btnSecondaryTxt}>Camera</Text>
              </Pressable>
            </View>
          </FadeUp>

          <FadeUp index={2}>
            <TouchableOpacity onPress={trySampleRoom} activeOpacity={0.75} style={hp.sampleLink}>
              <Text style={hp.sampleLinkTxt}>Explore with a sample space</Text>
              <ArrowRight size={14} color={colors.cream70} weight="light" />
            </TouchableOpacity>

            <Text style={hp.finePrint}>
              Works with rooms, wardrobes, gardens, collections & more
            </Text>
          </FadeUp>
        </View>
      </View>
    );
  }

  // ─── SCREEN 2: Scanning ─────────────────────────────────────────────────────
  const clampedRatio = Math.max(9 / 16, Math.min(imgRatio, 4 / 3));
  const photoWidth = W - 40;
  const photoHeight = Math.min(photoWidth / clampedRatio, H * 0.55);

  if (analyzing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.forest }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: spacing.horizontal }}>
          <GalleryNavPill light />
        </SafeAreaView>

        {/* Image with scan overlay */}
        <View style={[sc2.imgContainer, { marginTop: 16, height: photoHeight }]}>
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          <ScanOverlay imageHeight={photoHeight} />
          {/* Close */}
          <TouchableOpacity style={sc2.closeBtn} onPress={reset} activeOpacity={0.85}>
            <Text style={{ color: "#FFF", fontSize: 18, fontFamily: fonts.bodyLight }}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Status bottom */}
        <View style={sc2.statusBottom}>
          <LinearGradient
            colors={["transparent", colors.forest]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }}
          />
          <Animated.Text style={[sc2.headline, {
            opacity: shimmerTxt.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
          }]}>
            Reading your vibe...
          </Animated.Text>
          <Text style={sc2.subtext}>Detecting items, vibe & colour palette</Text>
          {/* Progress bar — scaleX from left to avoid Animated width error */}
          <View style={sc2.progressTrack}>
            <Animated.View style={[sc2.progressFill, {
              transform: [
                { translateX: shimmerTxt.interpolate({ inputRange: [0, 1], outputRange: [-0.3 * (SLIDER_W + 80), -0.15 * (SLIDER_W + 80)] }) },
                { scaleX: shimmerTxt.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] }) },
              ],
            }]} />
          </View>
        </View>
      </View>
    );
  }

  // ─── SCREEN 3: Analysis + Budget ────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image hero — top, bleeds from top with bottom radius */}
          <View style={[an.imageHero, { backgroundColor: "#0C0B0F" }]}>
            {imageUri ? (
              <TouchableOpacity activeOpacity={0.92} onPress={() => setViewerUri(imageUri)} style={StyleSheet.absoluteFill}>
                <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              </TouchableOpacity>
            ) : (
              <Shimmer style={StyleSheet.absoluteFill} />
            )}
            {/* subtle bottom gradient for header legibility */}
          <LinearGradient
              colors={["rgba(0,0,0,0.45)", "transparent"]}
              style={[StyleSheet.absoluteFill, { bottom: "70%" }]}
            />
            {/* Header overlay */}
            <SafeAreaView edges={["top"]} style={an.headerOverlay}>
              <View style={an.headerRow}>
                <BloomWordmark light size="sm" />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity style={an.headerPill} onPress={() => router.push("/(tabs)/gallery")} activeOpacity={0.85}>
                    <Ionicons name="images-outline" size={14} color="#FFF" />
                    <Text style={an.headerPillTxt}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={an.headerPill} onPress={reset} activeOpacity={0.85}>
                    <Plus size={16} color={colors.white} weight="bold" />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
            {/* Tap to view */}
            {imageUri && (
              <View style={an.tapHint} pointerEvents="none">
                <Ionicons name="expand-outline" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={an.tapHintTxt}>tap to view</Text>
              </View>
            )}
          </View>

          {analysis && (
            <View style={an.analysisCard}>
              <View style={an.eyebrowRow}>
                <View style={an.terracottaDot} />
                <Text style={an.eyebrow}>AI ANALYSIS</Text>
              </View>
              <Text style={an.analysisText}>{analysis.summary}</Text>
              <View style={an.bullets}>
                {analysis.strengths.slice(0, 2).map((str, i) => (
                  <View key={`s${i}`} style={an.bulletRow}>
                    <View style={an.bulletDot} />
                    <Text style={an.bulletTxt}>{str}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ paddingHorizontal: spacing.horizontal }}>
            {/* Detected items */}
            {analysis && analysis.items.length > 0 && (
              <>
                <Text style={an.sectionLabel}>DETECTED IN YOUR PHOTO</Text>
                <FlatList
                  data={analysis.items}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={item => item.id}
                  style={{ marginBottom: 24 }}
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                  scrollEnabled
                  nestedScrollEnabled
                  renderItem={({ item }) => {
                    const hasCrop = !!cropMap[item.label];
                    return (
                      <View style={an.itemChip}>
                        {hasCrop ? (
                          <Image source={{ uri: cropMap[item.label] }} style={an.itemImg} contentFit="cover" />
                        ) : (
                          <Shimmer style={an.itemImg} />
                        )}
                        <View style={an.itemMeta}>
                          <Text style={an.itemName} numberOfLines={1}>{item.label}</Text>
                          <Text style={an.itemConf}>{item.confidence}%</Text>
                        </View>
                      </View>
                    );
                  }}
                />
              </>
            )}

            {/* Budget section */}
            {analysis && (
              <>
                <Text style={an.sectionLabel}>YOUR BUDGET</Text>
                <View style={an.sliderCard}>
                  <BudgetSlider value={budget} onChange={setBudget} />
                </View>
              </>
            )}

            {/* Style direction */}
            {analysis && (
              <>
                <Text style={an.sectionLabel}>STYLE DIRECTION  ·  optional</Text>
                <View style={[an.inputWrap, prompt.length > 0 && { borderColor: colors.forest }]}>
                  <Ionicons name="color-wand-outline" size={18} color={colors.sage} />
                  <TextInput
                    style={an.input}
                    placeholder="e.g. warm boho, minimal japandi, maximalist..."
                    placeholderTextColor="rgba(26,26,26,0.35)"
                    value={prompt}
                    onChangeText={setPrompt}
                    returnKeyType="done"
                  />
                  {prompt.length > 0 && (
                    <TouchableOpacity onPress={() => setPrompt("")} hitSlop={10}>
                      <Ionicons name="close" size={14} color={colors.sage} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ marginBottom: 24, marginTop: 10 }}>
                  <StyleChips selected={selectedChip} onSelect={setSelectedChip} />
                </View>
              </>
            )}

            {/* Analyzing placeholder */}
            {!analysis && !analyzing && (
              <View style={{ marginTop: 20, alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bodyLight, color: colors.sage, fontSize: 14 }}>
                  Upload an image to get started
                </Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={an.errRow}>
                <Ionicons name="warning" size={13} color={colors.terracotta} />
                <Text style={an.errTxt}>{error}</Text>
              </View>
            )}

            {/* CTA */}
            {analysis && (
              <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                <TouchableOpacity style={an.cta} onPress={goToProducts} activeOpacity={0.87}>
                  <Text style={an.ctaTxt}>✦  Show Suggestions  →</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {viewerUri && (
        <ImageViewer visible={!!viewerUri} uri={viewerUri} onClose={() => setViewerUri(null)} />
      )}
    </View>
  );
}

// ─── Homepage styles ──────────────────────────────────────────────────────────
const hp = StyleSheet.create({
  topFade:    { position: "absolute", top: 0, left: 0, right: 0, height: 100, opacity: 0.35 },
  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  galleryPill:{
    borderRadius: radius.pill, overflow: "hidden",
    borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  galleryInner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  galleryDivider: { width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.22)" },
  paletteDots:    { flexDirection: "row", gap: 3 },
  dot:            { width: 7, height: 7, borderRadius: 4 },
  galleryTxt:     { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.cream },
  bottom:         { position: "absolute", bottom: 0, left: 0, right: 0 },
  heroText:       { paddingHorizontal: spacing.horizontal, marginBottom: 28 },
  eyebrow:        { fontSize: 10, fontFamily: fonts.bodyMedium, letterSpacing: 3, textTransform: "uppercase", color: "rgba(244,239,230,0.65)", marginBottom: 14 },
  title:          { fontSize: 52, fontFamily: fonts.displayBold, lineHeight: 54, color: colors.white, letterSpacing: -0.5 },
  titleItalic:    { fontFamily: fonts.displayBoldItalic },
  sub:            { fontSize: 15, fontFamily: fonts.bodyLight, color: colors.cream70, marginTop: 12, lineHeight: 23 },
  actions:        { flexDirection: "row", gap: 12, paddingHorizontal: spacing.horizontal, marginBottom: 14 },
  btnPressed:     { transform: [{ scale: 0.97 }] },
  btnPrimary: {
    flex: 0.60, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 56, borderRadius: radius.pill, backgroundColor: colors.white,
    ...primaryButtonShadow,
  },
  btnPrimaryTxt:  { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.charcoal },
  btnSecondary: {
    flex: 0.40, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 56, borderRadius: radius.pill, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.38)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  btnSecondaryTxt:{ fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.cream },
  sampleLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    alignSelf: "center", marginBottom: 12, paddingVertical: 8,
  },
  sampleLinkTxt:  { fontSize: 13, fontFamily: fonts.bodyMedium, color: "rgba(244,239,230,0.78)" },
  finePrint:      { fontSize: 12, fontFamily: fonts.bodyLight, color: colors.white40, textAlign: "center" },
  demoBanner: {
    marginHorizontal: spacing.horizontal, marginBottom: 18,
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: radius.input,
    backgroundColor: "rgba(196,113,74,0.22)",
    borderWidth: 1, borderColor: "rgba(196,113,74,0.35)",
  },
  demoBannerTxt:  { fontSize: 11, fontFamily: fonts.bodyRegular, color: "rgba(244,239,230,0.92)", lineHeight: 16, textAlign: "center" },
  demoBannerBold: { fontFamily: fonts.bodySemiBold, color: colors.cream },
});

// ─── Scanning (Screen 2) styles ───────────────────────────────────────────────
const sc2 = StyleSheet.create({
  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  galleryPill:{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: "rgba(255,255,255,0.20)", overflow: "hidden" },
  galleryTxt: { fontSize: 12, fontFamily: fonts.bodyMedium, color: "rgba(255,255,255,0.8)" },
  imgContainer:{
    marginHorizontal: spacing.horizontal, borderRadius: 24, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", position: "relative",
  },
  closeBtn:   { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.40)", alignItems: "center", justifyContent: "center" },
  statusBottom:{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 60, paddingTop: 80 },
  headline:   { fontSize: 28, fontFamily: fonts.displayMedium, color: colors.white, fontStyle: "italic", marginBottom: 6 },
  subtext:    { fontSize: 14, fontFamily: fonts.bodyLight, color: "rgba(244,239,230,0.55)" },
  progressTrack:{ marginTop: 20, height: 2, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.10)" },
  progressFill: { height: "100%", borderRadius: 100, backgroundColor: colors.sage, width: "100%" },
});

// ─── Analysis (Screen 3) styles ───────────────────────────────────────────────
const an = StyleSheet.create({
  imageHero:  { height: H * 0.50, overflow: "hidden", position: "relative" },
  headerOverlay:{ position: "absolute", top: 0, left: 0, right: 0 },
  headerRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.horizontal, paddingVertical: 12 },
  headerPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100, backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: colors.glassBorder },
  headerPillTxt: { fontSize: 12, fontFamily: fonts.bodyMedium, color: "#FFF" },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.40)", alignItems: "center", justifyContent: "center" },
  tapHint:    { position: "absolute", bottom: 16, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.38)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tapHintTxt: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: fonts.bodyMedium },

  analysisCard:{
    marginHorizontal: spacing.horizontal, marginTop: -32,
    backgroundColor: colors.mist, borderRadius: radius.card, padding: 24,
    borderWidth: 1, borderColor: `${colors.forest}12`,
    ...elevationShadow, marginBottom: 28,
  },
  terracottaDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  eyebrow:    { fontSize: 10, fontFamily: fonts.bodySemiBold, letterSpacing: 2.5, textTransform: "uppercase", color: colors.sage },
  analysisText:{ fontSize: 22, fontFamily: fonts.displayMedium, color: colors.forest, lineHeight: 30, letterSpacing: -0.2 },
  bullets:    { gap: 8, marginTop: 12 },
  bulletRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest, marginTop: 7 },
  bulletTxt:  { fontSize: 13, fontFamily: fonts.bodyRegular, color: "#4A4A4A", lineHeight: 20, flex: 1 },

  sectionLabel:{ fontSize: 10, fontFamily: fonts.bodySemiBold, letterSpacing: 2.5, textTransform: "uppercase", color: colors.sage, marginBottom: 12, marginTop: 4 },

  itemChip:   { width: 72, alignItems: "center" },
  itemImg:    { width: 60, height: 60, borderRadius: 14, borderWidth: 1.5, borderColor: colors.linen, overflow: "hidden" },
  itemMeta:   { marginTop: 6, alignItems: "center", gap: 2 },
  itemName:   { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.charcoal },
  itemConf:   { fontSize: 11, fontFamily: fonts.bodyRegular, color: colors.sage },

  sliderCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: `${colors.forest}10`, ...cardShadow },

  inputWrap:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.cream, borderWidth: 1.5, borderColor: colors.linen, borderRadius: radius.input, paddingHorizontal: 16, height: 52 },
  input:      { flex: 1, fontSize: 14, fontFamily: fonts.bodyLight, color: colors.charcoal },

  errRow:     { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 14, backgroundColor: "rgba(196,113,74,0.08)" },
  errTxt:     { fontSize: 13, flex: 1, fontFamily: fonts.bodyRegular, color: colors.terracotta },

  cta:        {
    height: 58, borderRadius: 100, backgroundColor: colors.forest,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
    shadowColor: colors.forest, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 10,
  },
  ctaTxt:     { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.cream },
});
