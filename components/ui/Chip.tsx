import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, radius, spacing, typography } from '@/constants/theme';

export interface ChipOption<T extends string = string> {
  key: T;
  label: string;
}

interface ChipProps<T extends string = string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (key: T) => void;
  scrollable?: boolean;
}

export function Chip<T extends string = string>({
  options,
  value,
  onChange,
  scrollable = false,
}: ChipProps<T>) {
  const { resolvedTheme: t } = useUiPreferences();

  const content = options.map((opt) => {
    const selected = opt.key === value;
    return (
      <AnimatedPressable
        key={opt.key}
        variant="chip"
        style={[
          styles.chip,
          { backgroundColor: selected ? t.segmentActive : t.cardTint, borderColor: selected ? t.brand : 'transparent' },
        ]}
        onPress={() => onChange(opt.key)}
        haptic="light"
        accessibilityRole="tab"
        accessibilityState={{ selected }}
      >
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? t.brand : t.mutedDark },
            selected && styles.chipLabelSelected,
          ]}
        >
          {opt.label}
        </Text>
      </AnimatedPressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  chipLabel: {
    ...typography.label,
  },
  chipLabelSelected: {
    fontFamily: fonts.bengaliSemiBold,
  },
});
