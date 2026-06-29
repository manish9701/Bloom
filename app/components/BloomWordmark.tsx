import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";
import BloomLogo from "./BloomLogo";

type Props = {
  light?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function BloomWordmark({ light = true, size = "md" }: Props) {
  const textColor = light ? colors.cream : colors.forest;
  const logoColor = light ? colors.cream : colors.forest;
  const logoSize = size === "lg" ? 32 : size === "sm" ? 22 : 26;
  const titleSize = size === "lg" ? 26 : size === "sm" ? 16 : 20;

  return (
    <View style={s.row}>
      <BloomLogo size={logoSize} color={logoColor} />
      <Text style={[s.word, { color: textColor, fontSize: titleSize }]}>bloom</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row:  { flexDirection: "row", alignItems: "center", gap: 8 },
  word: { fontFamily: fonts.displayMedium, letterSpacing: 0.3 },
});
