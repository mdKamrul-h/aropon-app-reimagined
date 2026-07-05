/** Aropon — Dokan (দোকান) design tokens for Bangladeshi shop owners */
export const dokan = {
  primary: '#1B5E20',
  primary2: '#388E3C',
  accent: '#0D3B14',
  accent2: '#66BB6A',
  gold: '#C8860A',
  goldLight: '#F9A825',
  income: '#1B7A3D',
  expense: '#C62828',
  bg1: '#FAF8F4',
  bg2: '#F5F2EC',
  card: '#FFFFFF',
  ink: '#1A1A14',
  muted: '#6B6560',
  chip: '#E8F5E9',
  ai: '#2E7D32',
} as const;

/** Legacy ocean palette — kept for mood customization */
export const ocean = {
  primary: '#155e75',
  primary2: '#0891b2',
  accent: '#0c4a5e',
  accent2: '#67e8f9',
  income: '#14b8a6',
  expense: '#fb7185',
  bg1: '#ecfeff',
  bg2: '#f0fdfa',
  card: '#ffffff',
  ink: '#083344',
  muted: '#5f8a96',
  chip: '#cffafe',
  ai: '#0e7490',
} as const;

export const brand = {
  primary: dokan.primary,
  dark: dokan.accent,
  darker: '#0A2E10',
  light: dokan.primary2,
  gold: dokan.gold,
  fabStart: dokan.primary2,
  fabEnd: dokan.primary,
} as const;

export const heroGradient = [dokan.primary, dokan.accent, dokan.primary2] as const;

export const colors = {
  brand: brand.primary,
  brandDark: brand.dark,
  brandLight: brand.light,
  brandGold: brand.gold,
  surface: dokan.bg2,
  card: dokan.card,
  ink: dokan.ink,
  inkSecondary: '#3D3D35',
  muted: dokan.muted,
  mutedDark: dokan.accent,
  border: '#E8E2D8',
  receive: dokan.income,
  pay: dokan.expense,
  amber: dokan.goldLight,
  profitStart: dokan.primary,
  profitEnd: dokan.income,
  black: '#000000',
  white: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.50)',
  syncOnline: dokan.income,
  syncPending: dokan.goldLight,
  syncOffline: dokan.muted,
  chip: dokan.chip,
  ai: dokan.ai,
  receiveTint: '#E8F5E9',
  receiveTintBorder: '#A5D6A7',
  payTint: '#FFEBEE',
  payTintBorder: '#EF9A9A',
  neutralTint: '#FFF8E1',
  neutralTintBorder: '#FFE082',
  amberTint: '#FFF8E1',
  amberTintBorder: '#FFE082',
} as const;

export const quickActionTints = {
  sale: '#E8F5E9',
  purchase: '#FFF3E0',
  receive: '#E0F2F1',
  pay: '#FFEBEE',
  expense: '#F3E5F5',
  party: '#FFF8E1',
} as const;

export type BandGradientKey = 'green' | 'teal' | 'amber' | 'orange' | 'red';

export const bandGradients: Record<BandGradientKey, readonly [string, string]> = {
  green: ['#1B5E20', '#388E3C'],
  teal: ['#155e75', '#0891b2'],
  amber: ['#C8860A', '#F9A825'],
  orange: ['#E65100', '#FF9800'],
  red: ['#B71C1C', '#C62828'],
} as const;

export const tabBarGradient = [brand.primary, brand.dark] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  touchMin: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 20,
  pill: 999,
} as const;

export const fonts = {
  bengaliRegular: 'HindSiliguri_400Regular',
  bengaliMedium: 'HindSiliguri_500Medium',
  bengaliSemiBold: 'HindSiliguri_600SemiBold',
  bengaliBold: 'HindSiliguri_700Bold',
  numeral: 'HindSiliguri_700Bold',
  latinSemiBold: 'Outfit_600SemiBold',
  latinBold: 'Outfit_700Bold',
  latinExtraBold: 'Outfit_800ExtraBold',
  latinRegular: 'Outfit_400Regular',
} as const;

export const typography = {
  appTitle:    { fontFamily: fonts.bengaliBold,     fontSize: 32, lineHeight: 42 },
  screenTitle: { fontFamily: fonts.bengaliBold,     fontSize: 24, lineHeight: 32 },
  sectionTitle:{ fontFamily: fonts.bengaliSemiBold, fontSize: 19, lineHeight: 28 },
  body:        { fontFamily: fonts.bengaliRegular,  fontSize: 19, lineHeight: 30 },
  bodySm:      { fontFamily: fonts.bengaliRegular,  fontSize: 17, lineHeight: 26 },
  label:       { fontFamily: fonts.bengaliSemiBold, fontSize: 16, lineHeight: 24 },
  caption:     { fontFamily: fonts.bengaliRegular,  fontSize: 14, lineHeight: 22 },
  heroAmount:  { fontFamily: fonts.numeral,         fontSize: 54, lineHeight: 62 },
  cardAmount:  { fontFamily: fonts.numeral,         fontSize: 32, lineHeight: 40 },
  numeralLg:   { fontFamily: fonts.numeral,         fontSize: 36, lineHeight: 44 },
} as const;

/** Light/dark palette system */
export type ThemeScheme = 'light' | 'dark';

export interface ThemePalette {
  brand: string;
  brandDark: string;
  brandLight: string;
  accent: string;
  accentDark: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  card: string;
  cardAlt: string;
  nav: string;
  ink: string;
  inkSecondary: string;
  muted: string;
  mutedDark: string;
  border: string;
  borderStrong: string;
  iconPrimary: string;
  iconMuted: string;
  receive: string;
  pay: string;
  amber: string;
  profitStart: string;
  profitEnd: string;
  black: string;
  white: string;
  scrim: string;
  syncOnline: string;
  syncPending: string;
  syncOffline: string;
  successBg: string;
  errorBg: string;
  glow: string;
  calculatorBg: string;
  calculatorPanel: string;
  calculatorKey: string;
  calculatorKeyAlt: string;
  calculatorKeyText: string;
}

export const lightColors: ThemePalette = {
  brand: dokan.primary,
  brandDark: dokan.accent,
  brandLight: dokan.primary2,
  accent: dokan.primary2,
  accentDark: dokan.accent,
  surface: dokan.bg2,
  surfaceAlt: dokan.bg1,
  surfaceMuted: '#EDE9E1',
  card: '#FFFFFF',
  cardAlt: '#FAFAF7',
  nav: '#FFFFFF',
  ink: dokan.ink,
  inkSecondary: '#3D3D35',
  muted: dokan.muted,
  mutedDark: dokan.accent,
  border: '#E8E2D8',
  borderStrong: '#D4CFC4',
  iconPrimary: dokan.primary,
  iconMuted: '#9E9890',
  receive: dokan.income,
  pay: dokan.expense,
  amber: dokan.goldLight,
  profitStart: dokan.primary,
  profitEnd: dokan.income,
  black: '#000000',
  white: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.50)',
  syncOnline: dokan.income,
  syncPending: dokan.goldLight,
  syncOffline: dokan.muted,
  successBg: '#E8F5E9',
  errorBg: '#FFEBEE',
  glow: 'rgba(27,94,32,0.15)',
  calculatorBg: '#F5F2EC',
  calculatorPanel: '#FFFFFF',
  calculatorKey: '#FFFFFF',
  calculatorKeyAlt: '#EDE9E1',
  calculatorKeyText: dokan.ink,
};

export const darkColors: ThemePalette = {
  brand: '#66BB6A',
  brandDark: '#388E3C',
  brandLight: '#A5D6A7',
  accent: '#81C784',
  accentDark: '#4CAF50',
  surface: '#121810',
  surfaceAlt: '#1A2218',
  surfaceMuted: '#222C20',
  card: '#1E281C',
  cardAlt: '#253020',
  nav: '#141C12',
  ink: '#F5F2EC',
  inkSecondary: '#D4CFC4',
  muted: '#9E9890',
  mutedDark: '#BDB8AE',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',
  iconPrimary: '#81C784',
  iconMuted: '#7A756C',
  receive: '#66BB6A',
  pay: '#EF5350',
  amber: '#FFD54F',
  profitStart: '#388E3C',
  profitEnd: '#66BB6A',
  black: '#000000',
  white: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.78)',
  syncOnline: '#66BB6A',
  syncPending: '#FFD54F',
  syncOffline: '#7A756C',
  successBg: 'rgba(102,187,106,0.16)',
  errorBg: 'rgba(239,83,80,0.16)',
  glow: 'rgba(102,187,106,0.20)',
  calculatorBg: '#0E140C',
  calculatorPanel: '#1A2218',
  calculatorKey: '#222C20',
  calculatorKeyAlt: '#1E281C',
  calculatorKeyText: '#F5F2EC',
};

export function getThemePalette(scheme: ThemeScheme): ThemePalette {
  return scheme === 'dark' ? darkColors : lightColors;
}

export function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(percent < 0 ? c * (1 + percent) : c + (255 - c) * percent)));
  return `#${[f(r), f(g), f(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
