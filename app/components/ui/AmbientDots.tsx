import React, { useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "../../../lib/theme";

const { width: W, height: H } = Dimensions.get("window");

const DOTS = [
  { x: W * 0.15, startY: H * 0.6, size: 3, delay: 0 },
  { x: W * 0.72, startY: H * 0.55, size: 4, delay: 800 },
  { x: W * 0.45, startY: H * 0.7, size: 3, delay: 1600 },
  { x: W * 0.88, startY: H * 0.65, size: 3, delay: 400 },
  { x: W * 0.28, startY: H * 0.75, size: 5, delay: 1200 },
];

function Dot({ x, startY, size, delay }: typeof DOTS[0]) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withTiming(-80, { duration: 4000 + delay, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [delay, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: 0.2 + (Math.sin(Date.now() / 2000 + delay) + 1) * 0.1,
  }));

  return (
    <Animated.View
      style={[
        s.dot,
        { left: x, top: startY, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

export default function AmbientDots() {
  return (
  <>
    {DOTS.map((d, i) => (
      <Dot key={i} {...d} />
    ))}
  </>
  );
}

const s = StyleSheet.create({
  dot: {
    position: "absolute",
    backgroundColor: colors.cream,
  },
});
