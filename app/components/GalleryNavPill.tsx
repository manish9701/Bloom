import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Images, Plus } from "phosphor-react-native";
import BloomWordmark from "./BloomWordmark";
import { GlassPill } from "./ui";
import { colors, fonts, spacing } from "../../lib/theme";

type Props = {
  light?: boolean;
  showNew?: boolean;
};

export default function GalleryNavPill({ light = true, showNew = false }: Props) {
  const router = useRouter();

  return (
    <View style={s.row}>
      <BloomWordmark light={light} size="sm" />
      <View style={s.actions}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/gallery")}
          activeOpacity={0.75}
        >
          <GlassPill style={s.pill}>
            <View style={s.pillInner}>
              <Images size={18} color={colors.cream} weight="light" />
              <View style={s.divider} />
              <View style={s.dots}>
                <View style={[s.dot, { backgroundColor: colors.cream }]} />
                <View style={[s.dot, { backgroundColor: colors.sage }]} />
                <View style={[s.dot, { backgroundColor: colors.terracotta }]} />
              </View>
              <Text style={s.pillTxt}>Gallery</Text>
            </View>
          </GlassPill>
        </TouchableOpacity>
        {showNew ? (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.85}
            style={s.newBtn}
          >
            <Plus size={16} color={colors.cream} weight="bold" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  actions:  { flexDirection: "row", alignItems: "center", gap: 8 },
  pill:     {},
  pillInner:{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 9 },
  divider:  { width: 1, height: 16, backgroundColor: colors.glassBorder },
  dots:     { flexDirection: "row", gap: 3 },
  dot:      { width: 7, height: 7, borderRadius: 4 },
  pillTxt:  { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.cream },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
});
