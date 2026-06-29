import React from "react";
import { Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, fonts, radius, primaryButtonShadow, ctaShadow } from "../../../lib/theme";
import PressableScale from "./PressableScale";

type Variant = "primary" | "secondary" | "ghost" | "forest";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  flex?: number;
  disabled?: boolean;
};

const variantStyles: Record<Variant, { container: ViewStyle; label: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.white, ...primaryButtonShadow },
    label:     { color: colors.charcoal, fontFamily: fonts.bodySemiBold },
  },
  secondary: {
    container: {
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: 1.5,
      borderColor: colors.white35,
    },
    label: { color: colors.cream, fontFamily: fonts.bodyMedium },
  },
  ghost: {
    container: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
    label:     { color: colors.cream, fontFamily: fonts.bodyMedium, fontSize: 12 },
  },
  forest: {
    container: { backgroundColor: colors.forest, ...ctaShadow, height: 40, paddingHorizontal: 16 },
    label:     { color: colors.cream, fontFamily: fonts.bodyMedium, fontSize: 13 },
  },
};

export default function PillButton({
  label,
  onPress,
  variant = "primary",
  icon,
  style,
  flex,
  disabled,
}: Props) {
  const v = variantStyles[variant];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[s.base, v.container, flex != null && { flex }, style, disabled && s.disabled]}
    >
      {icon}
      <Text style={[s.label, v.label]}>{label}</Text>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
  },
  label: { fontSize: 15, fontFamily: fonts.bodySemiBold },
  disabled: { opacity: 0.5 },
});
