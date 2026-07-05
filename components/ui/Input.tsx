import { TextInput, View, Text, StyleSheet, type TextInputProps, type TextStyle } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { cardSurfaceStyle } from '@/lib/ui/cardSurfaceStyle';
import { spacing, typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: t.mutedDark }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.muted}
        style={[
          styles.input,
          cardSurfaceStyle(t) as TextStyle,
          {
            backgroundColor: t.card,
            color: t.ink,
            borderRadius: t.radiusLg,
            ...(error ? { borderWidth: 1.5, borderColor: t.pay } : {}),
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: t.pay }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { ...typography.label },
  input: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin + 4,
  },
  error: { ...typography.caption },
});
