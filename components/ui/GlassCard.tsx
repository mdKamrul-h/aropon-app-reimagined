import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { cardSurfaceStyle } from '@/lib/ui/cardSurfaceStyle';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

/** Solid themed card — borderless with soft shadow in light mode */
export function GlassCard({ children, style, padded = true }: GlassCardProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View
      style={[
        styles.card,
        cardSurfaceStyle(t),
        {
          backgroundColor: t.card,
          borderRadius: t.radiusXl,
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
    overflow: 'hidden',
    elevation: 0,
  },
  padded: { padding: 16 },
});
