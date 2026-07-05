import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing } from '@/constants/theme';

interface AppCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tint?: string;
}

export function AppCard({ children, style, padded = true, tint }: AppCardProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tint ?? t.card,
          borderColor: t.border,
          borderRadius: t.radiusXl,
          shadowColor: t.shadowColor,
          shadowOpacity: t.shadowOpacity,
        },
        style,
        padded && styles.padded,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  padded: { padding: spacing.lg },
});
