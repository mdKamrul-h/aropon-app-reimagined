import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

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
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View style={styles.wrap}>
      {groupLabel ? <Text style={[styles.groupLabel, { color: t.muted }]}>{groupLabel}</Text> : null}
      <View style={styles.grid}>
        {options.map((opt) => {
          const active = selectedId === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={[
                styles.chip,
                {
                  borderRadius: t.radiusXl,
                  borderColor: active ? t.brand : t.border,
                  backgroundColor: active ? `${t.brand}18` : t.card,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? t.brand : t.mutedDark }, active && { fontFamily: typography.label.fontFamily }]} numberOfLines={1}>
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
    borderWidth: 1.5,
  },
  chipText: {
    ...typography.bodySm,
  },
});
