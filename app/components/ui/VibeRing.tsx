import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { colors, fonts } from "../../../lib/theme";
import { motion } from "../../../lib/motion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score: number;
  size?: number;
};

export default function VibeRing({ score, size = 64 }: Props) {
  const progress = useSharedValue(0);
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: motion.duration.reveal });
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[s.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`${colors.sage}30`}
          strokeWidth={3}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.sage}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={s.label}>
        <Text style={s.score}>{score}</Text>
        <Text style={s.pct}>%</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: "center", justifyContent: "center" },
  label: { position: "absolute", flexDirection: "row", alignItems: "flex-start" },
  score: { fontSize: 20, fontFamily: fonts.displayBold, color: colors.forest },
  pct:   { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.sage, marginTop: 4 },
});
