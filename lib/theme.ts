/**
 * Bloom Premium Design System — v4
 * Cormorant Garamond (editorial) + DM Sans (UI)
 */

export const colors = {
  forest:      '#1C3A2E',
  sage:        '#7A9E82',
  cream:       '#F4EFE6',
  linen:       '#EDE7DA',
  terracotta:  '#C4714A',
  charcoal:    '#1A1A1A',
  mist:        '#F9F7F3',
  white:       '#FFFFFF',
  forest10:    'rgba(28,58,46,0.10)',
  shadow:      'rgba(28,58,46,0.10)',
  heroOverlay: 'rgba(18,32,24,0.82)',
  darkMid:     'rgba(18,32,24,0.65)',
  darkDeep:    'rgba(18,32,24,0.97)',
  glass:       'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.22)',
  cream65:     'rgba(244,239,230,0.65)',
  cream70:     'rgba(244,239,230,0.70)',
  cream55:     'rgba(244,239,230,0.55)',
  white15:     'rgba(255,255,255,0.15)',
  white35:     'rgba(255,255,255,0.35)',
  white40:     'rgba(255,255,255,0.40)',
  white55:     'rgba(255,255,255,0.55)',
  white68:     'rgba(255,255,255,0.68)',
  charcoal45:  'rgba(26,26,26,0.45)',
  charcoal55:  'rgba(26,26,26,0.55)',
  forestMid:   '#2E4A3C',
  linenDark:   '#D6CFC3',
  shimmerStart:'#E8E2D9',
  shimmerMid:  '#D6CFC3',
};

export const type = {
  displayHero:    54,
  displaySection: 38,
  displayCard:    22,
  displaySub:     28,
  body:           15,
  bodySm:         13,
  caption:        12,
  eyebrow:        10,
};

export const primaryButtonShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.20,
  shadowRadius: 32,
  elevation: 8,
};

export const cardShadow = {
  shadowColor: '#1C3A2E',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 24,
  elevation: 6,
};

export const elevationShadow = {
  shadowColor: '#1C3A2E',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14,
  shadowRadius: 40,
  elevation: 10,
};

export const ctaShadow = {
  shadowColor: '#1C3A2E',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 40,
  elevation: 14,
};

/** Cormorant = editorial headlines · DM Sans = UI */
export const fonts = {
  displayBold:       'CormorantGaramond_700Bold',
  displayBoldItalic: 'CormorantGaramond_700Bold_Italic',
  displayMedium:     'CormorantGaramond_600SemiBold',
  displayRegular:    'CormorantGaramond_400Regular',
  bodyLight:         'DMSans_300Light',
  bodyRegular:       'DMSans_400Regular',
  bodyMedium:        'DMSans_500Medium',
  bodySemiBold:      'DMSans_600SemiBold',
};

export const radius = {
  card:   20,
  pill:   100,
  input:  14,
  badge:  6,
  image:  24,
};

export const spacing = {
  horizontal: 20,
};

export type Theme = {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  gold: string;
  goldSoft: string;
  border: string;
  success: string;
  warning: string;
};

export const lightTheme: Theme = {
  bgPrimary:   colors.cream,
  bgSecondary: colors.linen,
  bgCard:      colors.white,
  text:        colors.forest,
  textMuted:   colors.sage,
  accent:      colors.terracotta,
  accentSoft:  `rgba(196,113,74,0.12)`,
  gold:        colors.sage,
  goldSoft:    `rgba(122,158,130,0.12)`,
  border:      `rgba(28,58,46,0.12)`,
  success:     colors.sage,
  warning:     colors.terracotta,
};

export const darkTheme: Theme = {
  bgPrimary:   colors.charcoal,
  bgSecondary: '#2A2A2A',
  bgCard:      '#1E1E1E',
  text:        colors.cream,
  textMuted:   colors.sage,
  accent:      colors.terracotta,
  accentSoft:  `rgba(196,113,74,0.18)`,
  gold:        colors.sage,
  goldSoft:    `rgba(122,158,130,0.14)`,
  border:      `rgba(255,255,255,0.10)`,
  success:     colors.sage,
  warning:     colors.terracotta,
};
