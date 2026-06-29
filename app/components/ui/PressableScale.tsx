import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { motion } from "../../../lib/motion";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function PressableScale({ children, onPress, style, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled && { transform: [{ scale: motion.press.scale }] },
      ]}
    >
      {children}
    </Pressable>
  );
}
