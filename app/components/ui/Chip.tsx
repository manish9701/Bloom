import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, fonts, radius } from "../../../lib/theme";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function Chip({ label, active = false, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.txt, active && s.txtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.linenDark,
    height: 34,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  txt:        { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.charcoal },
  txtActive:  { color: colors.cream },
});
