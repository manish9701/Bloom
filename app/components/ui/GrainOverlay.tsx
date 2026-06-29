import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Pattern, Rect, Circle } from "react-native-svg";

type Props = {
  opacity?: number;
};

/** Subtle noise texture overlay for hero/gradient surfaces */
export default function GrainOverlay({ opacity = 0.04 }: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse">
            <Circle cx="1" cy="2" r="0.6" fill="#1C3A2E" opacity="0.3" />
            <Circle cx="5" cy="6" r="0.5" fill="#1C3A2E" opacity="0.2" />
            <Circle cx="7" cy="1" r="0.4" fill="#1C3A2E" opacity="0.25" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grain)" />
      </Svg>
    </View>
  );
}
