/**
 * App configuration — API key detection & demo mode
 */
export function hasGoogleAIKey(): boolean {
  const key = process.env.EXPO_PUBLIC_GOOGLE_AI_KEY?.trim();
  return !!key && key !== "your_google_ai_api_key_here";
}

export const isDemoMode = !hasGoogleAIKey();
