import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, cardShadow, elevationShadow } from "../../../lib/theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  mist?: boolean;
};

export default function Card({ children, style, elevated = false, mist = false }: Props) {
  return (
    <View style={[
      s.card,
      elevated && elevationShadow,
      !elevated && cardShadow,
      mist && s.mist,
      style,
    ]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: `${colors.forest}10`,
  },
  mist: { backgroundColor: colors.mist },
});
