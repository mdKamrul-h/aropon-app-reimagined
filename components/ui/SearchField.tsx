import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { radius, spacing, typography } from '@/constants/theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  noResults?: boolean;
  noResultsText?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'খুঁজুন...',
  noResults,
  noResultsText = 'কিছু পাওয়া যায়নি',
}: SearchFieldProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        style={[
          styles.input,
          {
            backgroundColor: t.card,
            borderColor: t.border,
            color: t.ink,
          },
        ]}
        autoCorrect={false}
      />
      {noResults ? <Text style={[styles.noResults, { color: t.muted }]}>{noResultsText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  input: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    ...typography.body,
  },
  noResults: {
    ...typography.caption,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
});
