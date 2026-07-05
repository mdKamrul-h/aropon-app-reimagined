import { Platform, type ViewStyle } from 'react-native';
import type { ResolvedUiTheme } from '@/lib/ui/resolveUiTheme';

/** Subtle elevation — warm shadow for ledger-paper feel in light mode */
export function cardSurfaceStyle(t: ResolvedUiTheme): ViewStyle {
  if (t.isDark) {
    return {
      borderWidth: 1,
      borderColor: t.border,
      ...(Platform.OS !== 'web'
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
          }
        : {}),
    };
  }

  return {
    borderWidth: 1,
    borderColor: t.border,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: t.shadowOpacity,
    shadowRadius: 6,
    elevation: 2,
  };
}

/** Stronger elevation for tappable tiles (quick actions, etc.) */
export function tileElevatedStyle(t: ResolvedUiTheme): ViewStyle {
  if (t.isDark) {
    return {
      borderWidth: 1,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    };
  }

  return {
    borderWidth: 1,
    borderColor: t.border,
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  };
}
