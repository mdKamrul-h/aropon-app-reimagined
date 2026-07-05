import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '@/components/ui/GradientButton';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, spacing, typography } from '@/constants/theme';

interface DayCloseFooterProps {
  dayLocked: boolean;
  onPress: () => void;
}

export function DayCloseFooter({ dayLocked, onPress }: DayCloseFooterProps) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm) + 56,
          borderTopColor: t.border,
          backgroundColor: t.card,
        },
      ]}
    >
      {dayLocked ? (
        <Text style={[styles.lockedText, { color: t.mutedDark }]}>
          আজকের হিসাব লক করা হয়েছে
        </Text>
      ) : (
        <GradientButton compact label="দিন শেষের হিসাব মিলান" onPress={onPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  lockedText: {
    ...typography.bodySm,
    fontFamily: fonts.bengaliSemiBold,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
