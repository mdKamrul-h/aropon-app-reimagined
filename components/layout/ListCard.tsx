import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';

interface ListCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ListCard({ children, style }: ListCardProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View
      style={[
        styles.list,
        {
          backgroundColor: t.card,
          borderColor: t.border,
          borderRadius: t.radiusXl,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
