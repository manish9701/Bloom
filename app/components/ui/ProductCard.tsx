import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ImageSquare } from "phosphor-react-native";
import { colors, fonts, radius, cardShadow } from "../../../lib/theme";
import Shimmer from "./Shimmer";

type Props = {
  width: number;
  name: string;
  brand: string;
  price: number;
  matchScore: number;
  badge?: string;
  badgeColor?: string;
  imageUri?: string;
  loading?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
  slideAnim?: Animated.Value;
  index?: number;
};

export default function ProductCard({
  width,
  name,
  brand,
  price,
  matchScore,
  badge,
  badgeColor = colors.terracotta,
  imageUri,
  loading,
  selected,
  dimmed,
  onPress,
  onToggle,
  slideAnim,
  index = 0,
}: Props) {
  const cardSlide = slideAnim?.interpolate({
    inputRange: [0, 1],
    outputRange: [60 + index * 8, 0],
  });

  const content = (
    <View style={[
      s.card,
      { width },
      selected && s.selected,
      dimmed && s.dimmed,
    ]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={s.imgWrap}>
        {loading ? (
          <Shimmer style={StyleSheet.absoluteFill} />
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={s.img} contentFit="cover" transition={300} />
        ) : (
          <View style={s.placeholder}>
            <ImageSquare size={28} color={colors.sage} weight="light" />
          </View>
        )}
        {badge ? (
          <View style={[s.badge, { backgroundColor: badgeColor }]}>
            <Text style={s.badgeTxt}>{badge}</Text>
          </View>
        ) : null}
        <LinearGradient
          colors={["transparent", "rgba(18,32,24,0.35)"]}
          style={s.imgGrad}
          pointerEvents="none"
        />
      </TouchableOpacity>
      <View style={s.info}>
        <Text style={s.brand} numberOfLines={1}>{brand}</Text>
        <Text style={s.name} numberOfLines={2}>{name}</Text>
        <View style={s.row}>
          <Text style={s.price}>₹{price.toLocaleString("en-IN")}</Text>
          <Text style={s.match}>{matchScore}%</Text>
        </View>
      </View>
      {onToggle ? (
        <TouchableOpacity
          onPress={onToggle}
          style={[s.check, selected && s.checkOn]}
          activeOpacity={0.85}
        >
          {selected ? <Text style={s.checkMark}>✓</Text> : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (slideAnim) {
    return (
      <Animated.View style={{ opacity: slideAnim, transform: [{ translateY: cardSlide ?? 0 }] }}>
        {content}
      </Animated.View>
    );
  }
  return content;
}

const s = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    backgroundColor: colors.white,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${colors.forest}10`,
    ...cardShadow,
    marginBottom: 12,
    position: "relative",
  },
  selected: { borderColor: colors.terracotta, borderWidth: 2 },
  dimmed:   { opacity: 0.42 },
  imgWrap:  { height: 160, position: "relative" },
  img:      { width: "100%", height: "100%" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.linen,
  },
  imgGrad:  { position: "absolute", bottom: 0, left: 0, right: 0, height: 48 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.badge,
  },
  badgeTxt: { fontSize: 9, fontFamily: fonts.bodySemiBold, color: colors.white, letterSpacing: 0.5 },
  info:     { padding: 12, gap: 2 },
  brand:    { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.sage, textTransform: "uppercase", letterSpacing: 0.5 },
  name:     { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.charcoal, lineHeight: 18, minHeight: 36 },
  row:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price:    { fontSize: 15, fontFamily: fonts.displayMedium, color: colors.terracotta },
  match:    { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.sage },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  checkMark: { color: colors.white, fontSize: 12, fontFamily: fonts.bodySemiBold },
});
