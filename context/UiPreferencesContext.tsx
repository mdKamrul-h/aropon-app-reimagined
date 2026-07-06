import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_UI_PREFERENCES,
  SURPRISE_PRESETS,
} from '@/constants/uiMoods';
import { resolveUiTheme, type ResolvedUiTheme } from '@/lib/ui/resolveUiTheme';
import type { UiPreferenceKey, UiPreferences } from '@/types/uiPreferences';

const PREFS_KEY = 'aropon_ui_prefs';
const PREFS_VERSION = 3;

function migratePrefs(parsed: Partial<UiPreferences>): UiPreferences {
  const merged = mergePrefs(DEFAULT_UI_PREFERENCES, parsed);
  const version = (parsed as Partial<UiPreferences> & { _v?: number })._v ?? 1;
  if (version >= PREFS_VERSION) return merged;

  // Force the current default look onto every existing install — this
  // preference system has no user-facing picker yet, so "upgrade" just
  // means "match the shipped design," not "respect a customization."
  return mergePrefs(merged, DEFAULT_UI_PREFERENCES);
}

interface UiPreferencesContextValue {
  preferences: UiPreferences;
  resolvedTheme: ResolvedUiTheme;
  loading: boolean;
  setPreference: <K extends UiPreferenceKey>(key: K, value: UiPreferences[K]) => void;
  setPreferences: (patch: Partial<UiPreferences>) => void;
  applyPreset: (preset: Partial<UiPreferences>) => void;
  surpriseMe: () => void;
  resetToDefaults: () => void;
}

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

function mergePrefs(base: UiPreferences, patch: Partial<UiPreferences>): UiPreferences {
  return {
    ...base,
    ...patch,
    playfulness: { ...base.playfulness, ...patch.playfulness },
  };
}

export function UiPreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferencesState] = useState<UiPreferences>(DEFAULT_UI_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const effectivePrefs = useMemo(() => {
    const pref = preferences.themePreference ?? 'system';
    const colorScheme =
      pref === 'system'
        ? systemScheme === 'dark'
          ? 'dark'
          : 'light'
        : pref;
    if (colorScheme === preferences.colorScheme) return preferences;
    return { ...preferences, colorScheme };
  }, [preferences, systemScheme]);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<UiPreferences> & { _v?: number };
            const migrated = migratePrefs(parsed);
            setPreferencesState(migrated);
            if ((parsed._v ?? 1) < PREFS_VERSION) {
              void AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...migrated, _v: PREFS_VERSION }));
            }
          } catch {
            /* keep defaults */
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (next: UiPreferences) => {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...next, _v: PREFS_VERSION }));
  }, []);

  const setPreferences = useCallback(
    (patch: Partial<UiPreferences>) => {
      setPreferencesState((prev) => {
        const next = mergePrefs(prev, patch);
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const setPreference = useCallback(
    <K extends UiPreferenceKey>(key: K, value: UiPreferences[K]) => {
      setPreferences({ [key]: value } as Partial<UiPreferences>);
    },
    [setPreferences],
  );

  const applyPreset = useCallback(
    (preset: Partial<UiPreferences>) => setPreferences(preset),
    [setPreferences],
  );

  const surpriseMe = useCallback(() => {
    const preset = SURPRISE_PRESETS[Math.floor(Math.random() * SURPRISE_PRESETS.length)];
    setPreferences(preset);
  }, [setPreferences]);

  const resetToDefaults = useCallback(() => {
    setPreferencesState(DEFAULT_UI_PREFERENCES);
    void persist(DEFAULT_UI_PREFERENCES);
  }, [persist]);

  const resolvedTheme = useMemo(() => resolveUiTheme(effectivePrefs), [effectivePrefs]);

  const value = useMemo(
    () => ({
      preferences: effectivePrefs,
      resolvedTheme,
      loading,
      setPreference,
      setPreferences,
      applyPreset,
      surpriseMe,
      resetToDefaults,
    }),
    [effectivePrefs, resolvedTheme, loading, setPreference, setPreferences, applyPreset, surpriseMe, resetToDefaults],
  );

  return (
    <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  const ctx = useContext(UiPreferencesContext);
  if (!ctx) throw new Error('useUiPreferences must be used within UiPreferencesProvider');
  return ctx;
}
