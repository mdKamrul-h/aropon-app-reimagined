import { getThemePalette, type ThemePalette } from '@/constants/theme';
import type { ResolvedUiTheme } from '@/lib/ui/resolveUiTheme';

/** Map resolved UI theme to legacy ThemePalette for calculator / khata screens */
export function resolvedThemeToPalette(t: ResolvedUiTheme): ThemePalette {
  const base = getThemePalette(t.isDark ? 'dark' : 'light');
  return {
    ...base,
    brand: t.brand,
    brandDark: t.brandDark,
    brandLight: t.mood.primary2,
    accent: t.mood.primary2,
    accentDark: t.mood.accent,
    surface: t.surface,
    surfaceAlt: t.surfaceAlt,
    surfaceMuted: t.surfaceMuted,
    card: t.card,
    cardAlt: t.cardTint,
    nav: t.card,
    ink: t.ink,
    inkSecondary: t.inkSecondary,
    muted: t.muted,
    mutedDark: t.mutedDark,
    border: t.border,
    borderStrong: t.borderStrong,
    iconPrimary: t.iconPrimary,
    iconMuted: t.muted,
    receive: t.receive,
    pay: t.pay,
    amber: t.amber,
    profitStart: t.brand,
    profitEnd: t.receive,
    syncOnline: t.syncOnline,
    syncPending: t.syncPending,
    syncOffline: t.syncOffline,
    successBg: t.successBg,
    errorBg: t.errorBg,
    glow: t.glow,
    calculatorBg: t.isDark ? '#0E140C' : '#F5F2EC',
    calculatorPanel: t.card,
    calculatorKey: t.isDark ? '#222C20' : '#FFFFFF',
    calculatorKeyAlt: t.surfaceMuted,
    calculatorKeyText: t.ink,
  };
}
