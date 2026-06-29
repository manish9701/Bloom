import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../lib/ThemeContext";
import { motion } from "../lib/motion";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_700Bold_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ensureTableExists, isDynamoAvailable } from "../lib/dynamo";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_700Bold_Italic,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  // Initialize DynamoDB (optional, falls back to localStorage if not configured)
  useEffect(() => {
    if (isDynamoAvailable()) {
      ensureTableExists().then(ready => {
        if (ready) {
          console.log("[App] DynamoDB table ready for persistence");
        } else {
          console.log("[App] DynamoDB not configured, using localStorage fallback");
        }
      }).catch(err => {
        console.warn("[App] DynamoDB initialization failed:", err);
      });
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: motion.duration.screen,
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
