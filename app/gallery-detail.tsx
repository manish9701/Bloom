/**
 * Bloom — Gallery Detail
 * Full-screen composite view for a saved GlowUp
 * - Products in this look horizontal scroll
 * - Edit this look button → recommendations with original params
 * - ImageViewer on hero tap
 * - DM Sans fonts
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Dimensions, ScrollView, Animated,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing, ctaShadow } from "../lib/theme";
import { ArrowLeft, PencilSimple, ArrowRight, Bag, Sparkle } from "phosphor-react-native";
import { GlowUp } from "../lib/mockData";
import { AIProduct } from "../lib/aiService";
import { getGlowUpById } from "../lib/store";
import ImageViewer from "./components/ImageViewer";
import { Shimmer, VibeRing } from "./components/ui";

const { width: W, height: H } = Dimensions.get("window");

export default function GalleryDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; glowupJson?: string }>();

  const scrollY   = useRef(new Animated.Value(0)).current;
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!params.id && !params.glowupJson);
  const [glowup, setGlowup] = useState<GlowUp | null>(() => {
    // Legacy path: glowupJson param (keep for backward compat)
    if (params.glowupJson) {
      try { return JSON.parse(params.glowupJson) as GlowUp; } catch {}
    }
    return null;
  });

  // Load from store by ID (preferred path)
  useEffect(() => {
    if (params.id) {
      setLoading(true);
      getGlowUpById(params.id).then(g => {
        if (g) setGlowup(g);
        setLoading(false);
      });
    }
  }, [params.id]);

  const imgScale = scrollY.interpolate({
    inputRange: [-80, 0], outputRange: [1.18, 1], extrapolate: "clamp",
  });

  if (loading || !glowup) {
    return (
      <View style={[s.root, { backgroundColor: colors.cream, alignItems: "center", justifyContent: "center", gap: 12 }]}>
        {loading ? (
          <>
            <Shimmer style={{ width: W, height: H * 0.52, borderRadius: 0 }} />
            <Text style={{ color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 20 }}>Loading your look…</Text>
          </>
        ) : (
          <>
            <Sparkle size={40} color={`${colors.sage}80`} weight="light" />
            <Text style={{ color: colors.forest, fontFamily: fonts.displayMedium, fontSize: 16 }}>Look not found</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, backgroundColor: colors.forest }}>
              <Text style={{ color: colors.cream, fontFamily: fonts.bodyMedium }}>Back to gallery</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const scoreColor =
    glowup.score >= 90 ? colors.sage :
    glowup.score >= 75 ? colors.terracotta : colors.terracotta;

  const heroImage = glowup.compositeUri ?? glowup.imageUri;

  const editThisLook = () => {
    router.push({
      pathname: "/recommendations",
      params: {
        imageUri: glowup.imageUri,
        budget: "10000",
        analysisJson: glowup.analysisJson ?? "{}",
        cropMapJson: "{}",
        userPrompt: "",
        ...(glowup.selectedIds?.length
          ? { initialSelectedIdsJson: JSON.stringify(glowup.selectedIds) }
          : {}),
      },
    });
  };

  return (
    <View style={[s.root, { backgroundColor: colors.cream }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 0) + 32 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Hero image — tappable */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setViewerUri(heroImage)}
          style={s.heroWrap}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: imgScale }] }]}>
            <Image
              source={{ uri: heroImage }}
              style={s.heroImg}
              contentFit="cover"
              transition={400}
            />
          </Animated.View>

          <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={s.topGrad} />
          <LinearGradient
            colors={["transparent", colors.cream]}
            style={s.botGrad}
          />

          <TouchableOpacity
            style={[s.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={18} color={colors.white} weight="light" />
          </TouchableOpacity>

          {glowup.compositeUri && glowup.imageUri && (
            <View style={[s.baChip, { top: insets.top + 10 }]}>
              <Text style={s.baChipTxt}>Before & After</Text>
            </View>
          )}

          <View style={[s.vibePill, { top: insets.top + 10 }]}>
            <Sparkle size={10} color={colors.white} weight="fill" />
            <Text style={s.vibeTxt}>{glowup.vibe}</Text>
          </View>

          {/* Zoom hint */}
          <View style={[s.zoomHint, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <Text style={s.zoomHintTxt}>tap to zoom</Text>
          </View>

          {/* Bottom label */}
          <View style={s.heroLabel}>
            <Text style={s.heroTitle}>{glowup.label}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <VibeRing score={glowup.score} size={56} />
            <Text style={s.statLabel}>Style Score</Text>
          </View>
          <View style={s.divider} />
          <StatChip label="Products" value={`${glowup.productCount}`} sub="items" />
          <View style={s.divider} />
          <StatChip label="Saved on" value={glowup.date.split(" ")[0]} sub={glowup.date.split(" ").slice(1).join(" ")} />
        </View>

        <View style={{ paddingHorizontal: spacing.horizontal, marginTop: 16 }}>
          <TouchableOpacity
            style={s.editBtn}
            onPress={editThisLook}
            activeOpacity={0.85}
          >
            <PencilSimple size={16} color={colors.cream} weight="light" />
            <Text style={s.editBtnTxt}>Edit this look</Text>
            <ArrowRight size={14} color={colors.cream} weight="light" />
          </TouchableOpacity>
        </View>

        {/* Products in this look */}
        {(glowup.products?.length ?? 0) > 0 && (
          <View style={[s.section, { marginTop: 20 }]}>
            <Text style={[s.sectionEyebrow, { color: colors.sage }]}>PRODUCTS IN THIS LOOK</Text>
            <Text style={[s.sectionTitle, { color: colors.forest }]}>Shop the vibe</Text>
            <Text style={[s.sectionSub, { color: colors.sage }]}>{glowup.products!.length} curated items · tap to shop</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20, marginTop: 14 }}
            >
              {glowup.products!.map((product) => (
                <MiniProductCard
                  key={product.id}
                  product={product}
                  productImageUri={glowup.productImages?.[product.id]}
                />
              ))}
            </ScrollView>

            {/* Total spend */}
            <View style={[s.totalRow, { backgroundColor: colors.white, borderColor: `${colors.forest}18` }]}>
              <Text style={[s.totalLbl, { color: colors.sage }]}>Total spend</Text>
              <Text style={[s.totalVal, { color: colors.terracotta }]}>
                ₹{glowup.products!.reduce((sum, p) => sum + p.price, 0).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        )}

        {/* Variations strip */}
        {(glowup.variations?.length ?? 0) > 1 && (
          <View style={[s.section, { marginTop: 20 }]}>
            <Text style={[s.sectionEyebrow, { color: colors.sage }]}>VARIATIONS</Text>
            <Text style={[s.sectionTitle, { color: colors.forest }]}>All generated looks</Text>
            <Text style={[s.sectionSub, { color: colors.sage }]}>{glowup.variations!.length} composites · tap to view</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 20, marginTop: 12 }}
            >
              {glowup.variations!.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  onPress={() => setViewerUri(uri)}
                  style={[
                    s.varThumb,
                    uri === heroImage && { borderColor: colors.terracotta, borderWidth: 2 },
                    { borderColor: uri === heroImage ? colors.terracotta : `${colors.forest}18` },
                  ]}
                >
                  <Image source={{ uri }} style={s.varThumbImg} contentFit="cover" transition={300} />
                  <View style={[s.varLabel, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
                    <Text style={s.varLabelTxt}>#{idx + 1}</Text>
                  </View>
                  {uri === heroImage && (
                    <View style={[s.varActiveDot, { backgroundColor: colors.terracotta }]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Before image */}
        {glowup.compositeUri && glowup.imageUri && glowup.compositeUri !== glowup.imageUri && (
          <View style={[s.section, { borderTopColor: `${colors.forest}18` }]}>
            <Text style={[s.sectionEyebrow, { color: colors.sage }]}>BEFORE</Text>
            <Text style={[s.sectionTitle, { color: colors.forest }]}>Original space</Text>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setViewerUri(glowup.imageUri)}
              style={[s.beforeWrap, { borderColor: `${colors.forest}18` }]}
            >
              <Image source={{ uri: glowup.imageUri }} style={s.beforeImg} contentFit="cover" transition={300} />
            </TouchableOpacity>
          </View>
        )}

        {/* Info card */}
        <View style={[s.infoCard, { backgroundColor: colors.white, borderColor: `${colors.forest}18` }]}>
          <View style={[s.infoRow, { borderBottomColor: `${colors.forest}18` }]}>
            <Text style={[s.infoLabel, { color: colors.sage }]}>Space type</Text>
            <Text style={[s.infoValue, { color: colors.forest }]}>{glowup.label}</Text>
          </View>
          <View style={[s.infoRow, { borderBottomColor: `${colors.forest}18` }]}>
            <Text style={[s.infoLabel, { color: colors.sage }]}>Style vibe</Text>
            <View style={[s.vibeBadge, { backgroundColor: `${colors.terracotta}18` }]}>
              <Text style={[s.vibeBadgeTxt, { color: colors.terracotta }]}>{glowup.vibe}</Text>
            </View>
          </View>
          <View style={[s.infoRow, { borderBottomColor: "transparent" }]}>
            <Text style={[s.infoLabel, { color: colors.sage }]}>Score</Text>
            <View style={s.scoreBarWrap}>
              <View style={[s.scoreTrack, { backgroundColor: colors.linen }]}>
                <View style={[s.scoreFill, { width: `${glowup.score}%` as any, backgroundColor: scoreColor }]} />
              </View>
              <Text style={[s.scoreNum, { color: scoreColor }]}>{glowup.score}%</Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Image viewer */}
      {viewerUri && (
        <ImageViewer
          visible={!!viewerUri}
          uri={viewerUri}
          onClose={() => setViewerUri(null)}
          beforeUri={glowup.compositeUri && glowup.imageUri ? glowup.imageUri : undefined}
          afterUri={glowup.compositeUri && glowup.imageUri ? glowup.compositeUri : undefined}
          tags={glowup.products?.map(p => `${p.brand} ${p.name}`) ?? []}
        />
      )}
    </View>
  );
}

// ─── Mini Product Card ────────────────────────────────────────────────────────
function MiniProductCard({
  product, productImageUri,
}: { product: AIProduct; productImageUri?: string }) {
  const BADGE_COLORS: Record<string, string> = {
    add: colors.terracotta, replace: colors.terracotta, upgrade: colors.forest,
  };
  const badgeColor = BADGE_COLORS[product.action] ?? colors.terracotta;
  const badgeLabel = product.action === "replace" ? "SWAP" : product.action === "upgrade" ? "UP" : "NEW";

  return (
    <View style={[mp.card, { backgroundColor: colors.white, borderColor: `${colors.forest}18` }]}>
      {/* Product image or emoji fallback */}
      <View style={[mp.imgWrap, { backgroundColor: colors.linen }]}>
        {productImageUri ? (
          <Image
            source={{ uri: productImageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <Text style={mp.emoji}>{categoryEmoji(product.category)}</Text>
        )}
        <View style={[mp.badge, { backgroundColor: badgeColor }]}>
          <Text style={mp.badgeTxt}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={mp.body}>
        <Text style={[mp.brand, { color: colors.sage }]}>{product.brand.toUpperCase()}</Text>
        <Text style={[mp.name, { color: colors.forest }]} numberOfLines={2}>{product.name}</Text>
        <Text style={[mp.desc, { color: colors.sage }]} numberOfLines={2}>{product.description}</Text>
        <Text style={[mp.price, { color: colors.terracotta }]}>
          ₹{product.price.toLocaleString("en-IN")}
          {product.originalPrice ? (
            <Text style={[mp.origPrice, { color: colors.sage }]}>
              {" "}₹{product.originalPrice.toLocaleString("en-IN")}
            </Text>
          ) : null}
        </Text>
      </View>

      {/* Shop links row */}
      <View style={[mp.shopLinks, { borderTopColor: `${colors.forest}18` }]}>
        {product.shopLinks.slice(0, 2).map((link) => (
          <TouchableOpacity
            key={link.store}
            style={[mp.shopBtn, { backgroundColor: colors.forest }]}
            onPress={() => Linking.openURL(link.url).catch(() => {})}
            activeOpacity={0.82}
          >
            <Bag size={9} color={colors.cream} weight="light" />
            <Text style={mp.shopBtnTxt}>{link.store}</Text>
            <ArrowRight size={9} color={colors.cream} weight="light" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    Lighting: "💡", Plants: "🌿", Textiles: "🛋️",
    Organisation: "📦", Furniture: "🪑", Decor: "🎨",
  };
  return map[cat] ?? "✨";
}

const PRODUCT_CARD_W = 160;

const mp = StyleSheet.create({
  card: {
    width: PRODUCT_CARD_W, borderRadius: 16, overflow: "hidden",
    borderWidth: 1,
    shadowColor: "rgba(0,0,0,0.1)", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  imgWrap: {
    width: "100%", height: 90,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  emoji: { fontSize: 34 },
  badge: {
    position: "absolute", top: 8, right: 8,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  badgeTxt: { color: "#FFF", fontSize: 8, fontFamily: fonts.displayBold, letterSpacing: 0.5 },
  body:  { padding: 10, gap: 3 },
  brand: { fontSize: 8, fontFamily: fonts.displayBold, letterSpacing: 0.9, textTransform: "uppercase" },
  name:  { fontSize: 11, fontFamily: fonts.displayBold, lineHeight: 15 },
  desc:  { fontSize: 9, fontFamily: fonts.bodyRegular, lineHeight: 13 },
  price: { fontSize: 12, fontFamily: fonts.displayBold, marginTop: 4 },
  origPrice: { fontSize: 10, fontFamily: fonts.bodyRegular, textDecorationLine: "line-through" },
  shopLinks: {
    flexDirection: "row", gap: 6,
    paddingHorizontal: 8, paddingBottom: 8, paddingTop: 6,
    borderTopWidth: 1,
  },
  shopBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 3, paddingVertical: 6, borderRadius: 8,
  },
  shopBtnTxt: { color: "#FFF", fontSize: 9, fontFamily: fonts.displayBold },
});

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statValue}>{value}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  heroWrap: { width: W, height: H * 0.52, position: "relative", overflow: "hidden" },
  heroImg:  { width: "100%", height: "100%" },
  topGrad:  { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  botGrad:  { position: "absolute", bottom: 0, left: 0, right: 0, height: 200 },

  backBtn: {
    position: "absolute", top: 48, left: 18,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center", justifyContent: "center",
  },

  vibePill: {
    position: "absolute", right: 18,
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
    backgroundColor: `${colors.sage}DD`,
  },
  vibeTxt: { color: "#fff", fontSize: 12, fontFamily: fonts.displayBold },

  zoomHint: {
    position: "absolute", bottom: 68, right: 14,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  zoomHintTxt: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontFamily: fonts.bodyMedium },

  heroLabel: { position: "absolute", bottom: 28, left: 20, right: 20 },
  heroTitle: {
    color: "#fff", fontSize: 28, fontFamily: fonts.displayBold, letterSpacing: -0.6,
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },

  statsRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: spacing.horizontal, marginTop: -24,
    borderRadius: radius.card, borderWidth: 1,
    borderColor: `${colors.forest}10`,
    backgroundColor: colors.white,
    paddingVertical: 16,
    shadowColor: colors.forest, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 6,
  },
  statItem:  { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.forest },
  statSub:   { fontSize: 10, fontFamily: fonts.bodyRegular, color: colors.sage },
  statLabel: { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.sage },
  divider:   { width: 1, height: 40, backgroundColor: `${colors.forest}10` },

  baChip: {
    position: "absolute", left: 72,
    backgroundColor: colors.glass,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  baChipTxt: { color: colors.cream, fontSize: 10, fontFamily: fonts.bodyMedium },

  editBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: radius.pill,
    backgroundColor: colors.forest,
    ...ctaShadow,
  },
  editBtnTxt: { color: colors.cream, fontSize: 15, fontFamily: fonts.bodySemiBold },

  section: { paddingHorizontal: spacing.horizontal, paddingTop: 24, borderTopWidth: 0, marginTop: 8 },
  sectionEyebrow: { fontSize: 10, fontFamily: fonts.displayBold, letterSpacing: 1.4, marginBottom: 4 },
  sectionTitle:   { fontSize: 18, fontFamily: fonts.displayBold, marginBottom: 2 },
  sectionSub:     { fontSize: 11, fontFamily: fonts.bodyRegular, marginBottom: 2 },
  totalRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  totalLbl: { fontSize: 12, fontFamily: fonts.bodyMedium },
  totalVal: { fontSize: 18, fontFamily: fonts.displayBold },

  beforeWrap: { borderRadius: 18, overflow: "hidden", borderWidth: 1, marginTop: 12 },
  beforeImg:  { width: "100%", height: 200 },

  infoCard: {
    marginHorizontal: spacing.horizontal, marginTop: 20,
    borderRadius: 18, borderWidth: 1, overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13, fontFamily: fonts.bodyRegular },
  infoValue: { fontSize: 13, fontFamily: fonts.displayBold },

  vibeBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  vibeBadgeTxt: { fontSize: 12, fontFamily: fonts.displayBold },

  scoreBarWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreTrack:   { width: 100, height: 5, borderRadius: 3, overflow: "hidden" },
  scoreFill:    { height: "100%", borderRadius: 3 },
  scoreNum:     { fontSize: 14, fontFamily: fonts.displayBold },

  varThumb: {
    width: 110, height: 80, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, position: "relative",
  },
  varThumbImg:  { width: "100%", height: "100%" },
  varLabel: {
    position: "absolute", bottom: 4, left: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  varLabelTxt: { color: "#fff", fontSize: 9, fontFamily: fonts.displayBold },
  varActiveDot: {
    position: "absolute", top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
  },
});
