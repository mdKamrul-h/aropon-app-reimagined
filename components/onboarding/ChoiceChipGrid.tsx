import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface ChoiceChipGridProps {
  options: { id: string; label: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  groupLabel?: string;
}

export function ChoiceChipGrid({
  options,
  selectedId,
  onSelect,
  groupLabel,
}: ChoiceChipGridProps) {
  return (
    <View style={styles.wrap}>
      {groupLabel ? <Text style={styles.groupLabel}>{groupLabel}</Text> : null}
      <View style={styles.grid}>
        {options.map((opt) => {
          const active = selectedId === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  groupLabel: {
    ...typography.caption,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    borderColor: colors.brand,
    backgroundColor: colors.chip,
  },
  chipText: {
    ...typography.bodySm,
    color: colors.mutedDark,
  },
  chipTextActive: {
    color: colors.brand,
    fontFamily: typography.label.fontFamily,
  },
});
