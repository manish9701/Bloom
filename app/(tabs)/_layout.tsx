/**
 * No bottom tab bar — single home screen only.
 * Gallery accessible from home via saved curations.
 */
import { Stack } from "expo-router";
import { motion } from "../../lib/motion";

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: motion.duration.screen,
      }}
    />
  );
}
