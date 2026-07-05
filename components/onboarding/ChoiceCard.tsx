import { Pressable, Text, StyleSheet, View } from 'react-native';
import { AroponIcon } from '@/components/icons/AroponIcon';
import type { IconName } from '@/components/icons/aroponIconData';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface ChoiceCardProps {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}

export function ChoiceCard({ label, icon, selected, onPress }: ChoiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
        <AroponIcon name={icon} size={32} />
      </View>
      <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 100,
  },
  cardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.chip,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${colors.brand}18`,
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.mutedDark,
  },
  labelActive: {
    color: colors.brand,
    fontFamily: typography.label.fontFamily,
  },
});
