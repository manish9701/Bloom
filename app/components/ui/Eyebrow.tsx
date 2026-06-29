import React from "react";
import { Text, StyleSheet, ViewStyle } from "react-native";
import { colors, fonts, type } from "../../../lib/theme";

type Props = {
  text: string;
  light?: boolean;
  style?: ViewStyle;
};

export default function Eyebrow({ text, light = false, style }: Props) {
  return (
    <Text style={[s.base, light ? s.light : s.dark, style]}>
      <Text style={{ color: colors.sage }}>✦</Text>  {text}
    </Text>
  );
}

const s = StyleSheet.create({
  base: {
    fontSize: type.eyebrow,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  light: { color: colors.cream65 },
  dark:  { color: colors.sage },
});
