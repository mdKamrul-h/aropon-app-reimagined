import React, { createContext, useContext, useMemo } from 'react';
import type { ThemePalette, ThemeScheme } from '@/constants/theme';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { resolvedThemeToPalette } from '@/lib/ui/themeBridge';
import type { ThemePreference } from '@/types/uiPreferences';

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedScheme: ThemeScheme;
  colors: ThemePalette;
  setPreference: (next: ThemePreference) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Bridges legacy useAppTheme() to unified UiPreferences resolved theme */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, resolvedTheme, setPreferences } = useUiPreferences();

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference: preferences.themePreference ?? 'system',
      resolvedScheme: preferences.colorScheme,
      colors: resolvedThemeToPalette(resolvedTheme),
      isDark: resolvedTheme.isDark,
      setPreference: async (next: ThemePreference) => {
        setPreferences({
          themePreference: next,
          colorScheme: next === 'system' ? preferences.colorScheme : next,
        });
      },
    }),
    [preferences.colorScheme, preferences.themePreference, resolvedTheme, setPreferences],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
