import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

interface YesNoToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

export function YesNoToggle({
  value,
  onChange,
  yesLabel = 'হ্যাঁ',
  noLabel = 'না',
}: YesNoToggleProps) {
  const { resolvedTheme: t } = useUiPreferences();

  const pillStyle = (active: boolean) => [
    styles.pill,
    {
      borderRadius: t.radiusXl,
      borderColor: active ? t.brand : t.border,
      backgroundColor: active ? `${t.brand}18` : t.card,
    },
  ];
  const textStyle = (active: boolean) => [
    styles.text,
    { color: active ? t.brand : t.mutedDark },
    active && { fontFamily: typography.sectionTitle.fontFamily },
  ];

  return (
    <View style={styles.row}>
      <Pressable onPress={() => onChange(false)} style={pillStyle(!value)}>
        <Text style={textStyle(!value)}>{noLabel}</Text>
      </Pressable>
      <Pressable onPress={() => onChange(true)} style={pillStyle(value)}>
        <Text style={textStyle(value)}>{yesLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pill: {
    flex: 1,
    minHeight: spacing.touchMin + 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  text: {
    ...typography.body,
  },
});
