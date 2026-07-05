import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

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
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(false)}
        style={[styles.pill, !value && styles.pillActive]}
      >
        <Text style={[styles.text, !value && styles.textActive]}>{noLabel}</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(true)}
        style={[styles.pill, value && styles.pillActive]}
      >
        <Text style={[styles.text, value && styles.textActive]}>{yesLabel}</Text>
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
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pillActive: {
    borderColor: colors.brand,
    backgroundColor: colors.chip,
  },
  text: {
    ...typography.body,
    color: colors.mutedDark,
  },
  textActive: {
    color: colors.brand,
    fontFamily: typography.sectionTitle.fontFamily,
  },
});
