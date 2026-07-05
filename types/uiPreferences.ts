export type ColorMood = 'dokan' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'candy' | 'mono';
export type GradientStyle = 'diagonal' | 'vertical' | 'radial' | 'mesh';
export type BackgroundIntensity = 'soft' | 'tinted' | 'bold';
export type CardStyle = 'white' | 'tinted' | 'glass';
export type CornerRoundness = 12 | 16 | 20 | 24 | 28;
export type Density = 'compact' | 'cozy' | 'roomy';
export type EntranceAnimation = 'none' | 'fade' | 'slide' | 'pop';
export type AnimationSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5;
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface PlayfulnessPrefs {
  blob: boolean;
  bounce: boolean;
  pulse: boolean;
}

export interface UiPreferences {
  colorMood: ColorMood;
  gradientStyle: GradientStyle;
  backgroundIntensity: BackgroundIntensity;
  cardStyle: CardStyle;
  cornerRoundness: CornerRoundness;
  density: Density;
  entranceAnimation: EntranceAnimation;
  animationSpeed: AnimationSpeed;
  playfulness: PlayfulnessPrefs;
  tapRipple: boolean;
  confettiOnCta: boolean;
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
}

export type UiPreferenceKey = keyof UiPreferences;
