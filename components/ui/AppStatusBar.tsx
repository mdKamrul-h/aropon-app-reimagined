import { StatusBar } from 'expo-status-bar';
import { useUiPreferences } from '@/context/UiPreferencesContext';

export function AppStatusBar() {
  const { resolvedTheme } = useUiPreferences();
  return <StatusBar style={resolvedTheme.isDark ? 'light' : 'dark'} />;
}
