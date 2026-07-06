import type { UiPreferences } from '@/types/uiPreferences';

export interface MoodPalette {
  id: UiPreferences['colorMood'];
  label_bn: string;
  primary: string;
  primary2: string;
  accent: string;
  ctaStart: string;
  ctaEnd: string;
  mesh: [string, string, string];
  swatch: string;
}

export const UI_MOODS: MoodPalette[] = [
  {
    id: 'dokan',
    label_bn: 'দোকান',
    primary: '#1B5E20',
    primary2: '#388E3C',
    accent: '#0D3B14',
    ctaStart: '#388E3C',
    ctaEnd: '#1B5E20',
    mesh: ['#E8F5E9', '#FFF8E1', '#F5F2EC'],
    swatch: '#2E7D32',
  },
  {
    id: 'ocean',
    label_bn: 'ওশান',
    primary: '#155e75',
    primary2: '#0891b2',
    accent: '#0c4a5e',
    ctaStart: '#0891b2',
    ctaEnd: '#0e7490',
    mesh: ['#67e8f9', '#a5f3fc', '#99f6e4'],
    swatch: '#0e7490',
  },
  {
    id: 'sunset',
    label_bn: 'সূর্যাস্ত',
    primary: '#ea580c',
    primary2: '#fb923c',
    accent: '#c2410c',
    ctaStart: '#f97316',
    ctaEnd: '#ec4899',
    mesh: ['#fdba74', '#fda4af', '#fde68a'],
    swatch: '#f97316',
  },
  {
    id: 'forest',
    label_bn: 'বন',
    primary: '#059669',
    primary2: '#34d399',
    accent: '#047857',
    ctaStart: '#10b981',
    ctaEnd: '#14b8a6',
    mesh: ['#6ee7b7', '#a7f3d0', '#bbf7d0'],
    swatch: '#059669',
  },
  {
    id: 'royal',
    label_bn: 'রয়্যাল',
    primary: '#7c3aed',
    primary2: '#a78bfa',
    accent: '#5b21b6',
    ctaStart: '#8b5cf6',
    ctaEnd: '#6366f1',
    mesh: ['#c4b5fd', '#a5b4fc', '#e9d5ff'],
    swatch: '#7c3aed',
  },
  {
    id: 'candy',
    label_bn: 'ক্যান্ডি',
    primary: '#db2777',
    primary2: '#f472b6',
    accent: '#be185d',
    ctaStart: '#ec4899',
    ctaEnd: '#f43f5e',
    mesh: ['#f9a8d4', '#fda4af', '#fbcfe8'],
    swatch: '#db2777',
  },
  {
    id: 'mono',
    label_bn: 'মোনো',
    primary: '#334155',
    primary2: '#64748b',
    accent: '#1e293b',
    ctaStart: '#475569',
    ctaEnd: '#334155',
    mesh: ['#cbd5e1', '#e2e8f0', '#f1f5f9'],
    swatch: '#334155',
  },
];

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  colorMood: 'ocean',
  gradientStyle: 'mesh',
  backgroundIntensity: 'tinted',
  cardStyle: 'tinted',
  cornerRoundness: 24,
  density: 'cozy',
  entranceAnimation: 'pop',
  animationSpeed: 1,
  playfulness: { blob: true, bounce: true, pulse: true },
  tapRipple: true,
  confettiOnCta: true,
  colorScheme: 'light',
  themePreference: 'system',
};

export const SURPRISE_PRESETS: Partial<UiPreferences>[] = [
  { colorMood: 'dokan', cardStyle: 'white', gradientStyle: 'vertical', entranceAnimation: 'fade' },
  { colorMood: 'forest', cardStyle: 'white', gradientStyle: 'vertical', entranceAnimation: 'fade' },
  { colorMood: 'sunset', cardStyle: 'tinted', gradientStyle: 'diagonal', entranceAnimation: 'slide' },
  { colorMood: 'ocean', cardStyle: 'glass', gradientStyle: 'mesh', entranceAnimation: 'pop' },
  { colorMood: 'royal', cardStyle: 'tinted', gradientStyle: 'radial', entranceAnimation: 'fade' },
];

export function getMood(id: UiPreferences['colorMood']): MoodPalette {
  return UI_MOODS.find((m) => m.id === id) ?? UI_MOODS[0];
}
