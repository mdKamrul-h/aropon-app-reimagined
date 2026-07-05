import { getMood } from '@/constants/uiMoods';
import type { UiPreferences } from '@/types/uiPreferences';

export interface ResolvedUiTheme {
  isDark: boolean;
  mood: ReturnType<typeof getMood>;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  card: string;
  cardTint: string;
  ink: string;
  inkSecondary: string;
  muted: string;
  mutedDark: string;
  border: string;
  borderStrong: string;
  brand: string;
  brandDark: string;
  brandGold: string;
  iconPrimary: string;
  heroGradient: readonly [string, string, string];
  headerGradient: readonly [string, string, string];
  ctaGradient: readonly [string, string];
  meshColors: [string, string, string];
  meshOpacity: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
  spacingScale: number;
  shadowColor: string;
  shadowOpacity: number;
  glassTint: 'light' | 'dark';
  glassBackground: string;
  glassBorder: string;
  glassBlurIntensity: number;
  quickActionTints: Record<string, string>;
  receive: string;
  pay: string;
  receiveTint: string;
  receiveTintBorder: string;
  payTint: string;
  payTintBorder: string;
  neutralTint: string;
  neutralTintBorder: string;
  amberTint: string;
  amberTintBorder: string;
  amber: string;
  successBg: string;
  errorBg: string;
  glow: string;
  syncOnline: string;
  syncPending: string;
  syncOffline: string;
  segmentActive: string;
  segmentActiveOnGradient: string;
  sectionReceive: string;
  sectionPay: string;
  animationDuration: (baseMs: number) => number;
  bounceScale: number;
}

const DENSITY_SCALE = { compact: 0.85, cozy: 1, roomy: 1.15 } as const;
const INTENSITY_OPACITY = { soft: 0.08, tinted: 0.14, bold: 0.22 } as const;

export function resolveUiTheme(prefs: UiPreferences): ResolvedUiTheme {
  const mood = getMood(prefs.colorMood);
  const isDark = prefs.colorScheme === 'dark';
  const scale = DENSITY_SCALE[prefs.density];
  const r = prefs.cornerRoundness;
  const meshOpacity = INTENSITY_OPACITY[prefs.backgroundIntensity];

  const surface = isDark ? '#121810' : '#FAF8F4';
  const surfaceAlt = isDark ? '#1A2218' : '#F5F2EC';
  const surfaceMuted = isDark ? '#222C20' : '#EDE9E1';
  const card = isDark ? '#1E281C' : '#FFFFFF';
  const cardTint = isDark ? '#253020' : '#FAFAF7';
  const ink = isDark ? '#F5F2EC' : '#1A1A14';
  const inkSecondary = isDark ? '#D4CFC4' : '#3D3D35';
  const muted = isDark ? '#9E9890' : '#6B6560';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#E8E2D8';
  const borderStrong = isDark ? 'rgba(255,255,255,0.18)' : '#D4CFC4';

  const heroGradient = [mood.primary, mood.accent, mood.primary2] as const;
  const headerGradient = isDark
    ? ([surfaceAlt, surfaceMuted, cardTint] as const)
    : ([mood.primary, mood.accent, mood.primary2] as const);
  const ctaGradient = [mood.ctaStart, mood.ctaEnd] as const;

  const grad = prefs.gradientStyle;
  const meshColors: [string, string, string] =
    grad === 'mesh'
      ? mood.mesh
      : grad === 'radial'
        ? [mood.primary2, mood.mesh[1], mood.mesh[2]]
        : grad === 'vertical'
          ? [mood.mesh[0], mood.mesh[1], mood.primary2]
          : [mood.mesh[1], mood.primary2, mood.mesh[2]];

  return {
    isDark,
    mood,
    surface,
    surfaceAlt,
    surfaceMuted,
    card,
    cardTint,
    ink,
    inkSecondary,
    muted,
    mutedDark: isDark ? '#BDB8AE' : mood.accent,
    border,
    borderStrong,
    brand: mood.primary,
    brandDark: mood.accent,
    brandGold: '#C8860A',
    iconPrimary: isDark ? '#81C784' : mood.primary,
    heroGradient,
    headerGradient,
    ctaGradient,
    meshColors,
    meshOpacity,
    radiusSm: Math.round(r * 0.5),
    radiusMd: Math.round(r * 0.65),
    radiusLg: Math.round(r * 0.85),
    radiusXl: r,
    spacingScale: scale,
    shadowColor: isDark ? '#000' : '#1A1A14',
    shadowOpacity: isDark ? 0.25 : 0.08,
    glassTint: isDark ? 'dark' : 'light',
    glassBackground: isDark ? 'rgba(30,40,28,0.96)' : 'rgba(255,255,255,0.98)',
    glassBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(232,226,216,0.80)',
    glassBlurIntensity: 0,
    quickActionTints: {
      sale: isDark ? '#1A2E1C' : '#E8F5E9',
      purchase: isDark ? '#2A2418' : '#FFF3E0',
      receive: isDark ? '#152A22' : '#E0F2F1',
      pay: isDark ? '#2A1818' : '#FFEBEE',
      expense: isDark ? '#221A28' : '#F3E5F5',
      party: isDark ? '#2A2818' : '#FFF8E1',
    },
    receive: isDark ? '#66BB6A' : '#1B7A3D',
    pay: isDark ? '#EF5350' : '#C62828',
    receiveTint: isDark ? '#1A2E1C' : '#E8F5E9',
    receiveTintBorder: isDark ? '#66BB6A55' : '#A5D6A7',
    payTint: isDark ? '#2A1818' : '#FFEBEE',
    payTintBorder: isDark ? '#EF535055' : '#EF9A9A',
    neutralTint: isDark ? '#222C20' : '#FFF8E1',
    neutralTintBorder: isDark ? 'rgba(255,255,255,0.12)' : '#FFE082',
    amberTint: isDark ? '#2A2418' : '#FFF8E1',
    amberTintBorder: isDark ? '#FFD54F55' : '#FFE082',
    amber: isDark ? '#FFD54F' : '#F9A825',
    successBg: isDark ? 'rgba(102,187,106,0.16)' : '#E8F5E9',
    errorBg: isDark ? 'rgba(239,83,80,0.16)' : '#FFEBEE',
    glow: isDark ? 'rgba(102,187,106,0.20)' : 'rgba(27,94,32,0.15)',
    syncOnline: isDark ? '#66BB6A' : '#1B7A3D',
    syncPending: isDark ? '#FFD54F' : '#F9A825',
    syncOffline: muted,
    segmentActive: isDark ? '#253020' : '#FFFFFF',
    segmentActiveOnGradient: '#FFFFFF',
    sectionReceive: isDark ? '#66BB6A' : '#1B7A3D',
    sectionPay: isDark ? '#EF5350' : '#9B1B1B',
    animationDuration: (baseMs) => Math.round(baseMs / prefs.animationSpeed),
    bounceScale: prefs.playfulness.bounce ? 0.94 : 0.97,
  };
}
