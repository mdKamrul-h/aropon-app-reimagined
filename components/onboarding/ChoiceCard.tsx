import { Pressable, Text, StyleSheet, View } from 'react-native';
import { AroponIcon } from '@/components/icons/AroponIcon';
import type { IconName } from '@/components/icons/aroponIconData';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

interface ChoiceCardProps {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}

export function ChoiceCard({ label, icon, selected, onPress }: ChoiceCardProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? `${t.brand}18` : t.card,
          borderRadius: t.radiusXl,
          borderColor: selected ? t.brand : t.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { borderRadius: t.radiusLg, backgroundColor: selected ? `${t.brand}18` : t.surface },
        ]}
      >
        <AroponIcon name={icon} size={32} />
      </View>
      <Text style={[styles.label, { color: selected ? t.brand : t.mutedDark }, selected && { fontFamily: typography.label.fontFamily }]} numberOfLines={2}>
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
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 100,
  },
  pressed: { opacity: 0.88 },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
  },
});
