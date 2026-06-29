/**
 * Bloom — Gallery (2-column lookbook grid)
 */
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Dimensions, RefreshControl, Pressable, ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus } from "phosphor-react-native";
import { getGallery } from "../../lib/store";
import { GlowUp } from "../../lib/mockData";
import BloomWordmark from "../components/BloomWordmark";
import EmptyGalleryIllustration from "../components/EmptyGalleryIllustration";
import { Chip, FadeUp } from "../components/ui";
import { colors, fonts, radius, elevationShadow, spacing } from "../../lib/theme";

const { width } = Dimensions.get("window");
const GAP = 12;
const CARD_W = (width - spacing.horizontal * 2 - GAP) / 2;

const FILTERS = ["All", "Interiors", "Garden", "Wardrobe", "Collection", "Office"];

function GalleryCard({ item, onPress }: { item: GlowUp; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={gc.card}>
      <View style={gc.imgWrap}>
        {(item.compositeUri || item.imageUri) ? (
          <Image
            source={{ uri: item.compositeUri ?? item.imageUri }}
            style={gc.img}
            contentFit="cover"
            transition={400}
          />
        ) : (
          <View style={gc.placeholder} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(18,32,24,0.55)"]}
          style={gc.imgGrad}
          pointerEvents="none"
        />
        <View style={gc.vibeChip}>
          <Text style={gc.vibeTxt} numberOfLines={1}>{item.vibe}</Text>
        </View>
        <View style={gc.matchChip}>
          <Text style={gc.matchTxt}>★ {item.score}%</Text>
        </View>
      </View>
      <View style={gc.info}>
        <Text style={gc.category} numberOfLines={1}>{item.label}</Text>
        <Text style={gc.meta}>{item.date} · {item.productCount} items</Text>
      </View>
    </Pressable>
  );
}

const gc = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: radius.image,
    overflow: "hidden",
    backgroundColor: colors.white,
    marginBottom: GAP,
    borderWidth: 1,
    borderColor: `${colors.forest}10`,
    ...elevationShadow,
  },
  imgWrap:    { width: "100%", height: 160, position: "relative" },
  img:        { width: "100%", height: "100%" },
  placeholder:{ width: "100%", height: 160, backgroundColor: colors.linen },
  imgGrad:    { position: "absolute", bottom: 0, left: 0, right: 0, height: 60 },
  vibeChip: {
    position: "absolute", top: 10, left: 10,
    backgroundColor: colors.glass,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.glassBorder,
    maxWidth: CARD_W - 60,
  },
  vibeTxt:    { color: colors.white, fontSize: 10, fontFamily: fonts.bodyRegular, fontStyle: "italic" },
  matchChip: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: colors.glass,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  matchTxt:   { color: colors.white, fontSize: 10, fontFamily: fonts.bodySemiBold },
  info:       { padding: 12 },
  category:   { fontSize: 16, fontFamily: fonts.displayMedium, color: colors.charcoal, letterSpacing: -0.2 },
  meta:       { fontSize: 11, fontFamily: fonts.bodyRegular, color: colors.charcoal55, marginTop: 4 },
});

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [gallery, setGallery] = useState<GlowUp[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const load = useCallback(async () => {
    setGallery(await getGallery());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openDetail = (item: GlowUp) => {
    router.push({ pathname: "/gallery-detail", params: { id: item.id } });
  };

  const filtered = activeFilter === "All"
    ? gallery
    : gallery.filter(g =>
        g.label?.toLowerCase().includes(activeFilter.toLowerCase()) ||
        g.vibe?.toLowerCase().includes(activeFilter.toLowerCase()),
      );

  const renderEmpty = () => (
    <FadeUp index={0} style={s.empty}>
      <EmptyGalleryIllustration />
      <Text style={s.emptyTitle}>Your first look awaits</Text>
      <Text style={s.emptySub}>
        Snap anything you love or upload a photo{"\n"}to get curated picks and see it reimagined.
      </Text>
      <TouchableOpacity
        style={s.emptyCta}
        onPress={() => router.push("/(tabs)")}
        activeOpacity={0.85}
      >
        <Text style={s.emptyCtaTxt}>✦  Curate my first look</Text>
      </TouchableOpacity>
    </FadeUp>
  );

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 32 },
          filtered.length === 0 && s.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.terracotta} />
        }
        ListHeaderComponent={() => (
          <>
            <View style={s.header}>
              <BloomWordmark light={false} size="md" />
              <TouchableOpacity
                style={s.newLookBtn}
                onPress={() => router.push("/(tabs)")}
                activeOpacity={0.85}
              >
                <Plus size={16} color={colors.cream} weight="bold" />
                <Text style={s.newLookTxt}>New Look</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.headerTitle}>Gallery</Text>
            <Text style={s.headerSub}>Your curated looks</Text>
            {gallery.length > 0 && (
              <Text style={s.count}>
                {gallery.length} look{gallery.length !== 1 ? "s" : ""} saved
              </Text>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filters}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {FILTERS.map(f => (
                <Chip
                  key={f}
                  label={f}
                  active={activeFilter === f}
                  onPress={() => setActiveFilter(f)}
                />
              ))}
            </ScrollView>
          </>
        )}
        renderItem={({ item }) => (
          <GalleryCard item={item} onPress={() => openDetail(item)} />
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.cream },
  list:       { paddingHorizontal: spacing.horizontal },
  listEmpty:  { flexGrow: 1 },
  row:        { gap: GAP },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 8, marginBottom: 20,
  },
  newLookBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.forest, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: radius.pill,
  },
  newLookTxt: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.cream },
  headerTitle:{ fontSize: 38, fontFamily: fonts.displayBold, color: colors.charcoal, letterSpacing: -0.5 },
  headerSub:  { fontSize: 14, fontFamily: fonts.bodyLight, color: colors.charcoal45, marginTop: 2 },
  count:      { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.sage, marginTop: 8 },
  filters:    { marginVertical: 16 },
  empty:      { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: {
    fontSize: 26, fontFamily: fonts.displayMedium, color: colors.charcoal,
    marginTop: 28, textAlign: "center",
  },
  emptySub: {
    fontSize: 15, fontFamily: fonts.bodyLight, color: colors.charcoal45,
    marginTop: 10, textAlign: "center", lineHeight: 24,
  },
  emptyCta: {
    marginTop: 32, backgroundColor: colors.forest, paddingHorizontal: 28,
    paddingVertical: 16, borderRadius: radius.pill, width: 240, alignItems: "center",
  },
  emptyCtaTxt:{ fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.cream },
});
