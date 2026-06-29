import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { colors, radius } from "../../../lib/theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

export default function GlassPill({ children, style, intensity = 40 }: Props) {
  return (
    <View style={[s.wrap, style]}>
      {Platform.OS !== "web" ? (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.webFallback]} />
      )}
      <View style={s.inner}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  webFallback: { backgroundColor: "rgba(28,58,46,0.45)" },
  inner: { flexDirection: "row", alignItems: "center" },
});
