import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { motion } from "../../../lib/motion";

type Props = {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
};

export default function FadeUp({ children, index = 0, style }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    const delay = motion.stagger.delay(index);
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.duration.reveal }));
    translateY.value = withDelay(delay, withTiming(0, { duration: motion.duration.reveal }));
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
