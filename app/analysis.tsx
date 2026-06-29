/**
 * analysis.tsx — redirect shim
 * The full flow now lives on the home screen.
 * This file exists only in case of deep links; it redirects to home.
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function AnalysisRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(tabs)");
  }, []);
  return null;
}
