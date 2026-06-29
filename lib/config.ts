/**
 * App configuration — API key detection & demo mode
 */
export function hasOpenRouterKey(): boolean {
  const key = process.env.EXPO_PUBLIC_OPENROUTER_KEY?.trim();
  return !!key && key !== "your_openrouter_api_key_here";
}

export const isDemoMode = !hasOpenRouterKey();
