import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing, type } from "../../../lib/theme";
import Eyebrow from "./Eyebrow";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
};

export default function SectionHeader({ eyebrow, title, subtitle, light = false }: Props) {
  return (
    <View style={s.wrap}>
      {eyebrow ? <Eyebrow text={eyebrow} light={light} /> : null}
      <Text style={[s.title, light && s.titleLight]}>{title}</Text>
      {subtitle ? <Text style={[s.sub, light && s.subLight]}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:       { paddingHorizontal: spacing.horizontal },
  title:      { fontSize: type.displaySection, fontFamily: fonts.displayBold, color: colors.charcoal, letterSpacing: -0.5 },
  titleLight: { color: colors.white },
  sub:        { fontSize: type.bodySm, fontFamily: fonts.bodyLight, color: colors.charcoal45, marginTop: 2 },
  subLight:   { color: colors.cream70 },
});
