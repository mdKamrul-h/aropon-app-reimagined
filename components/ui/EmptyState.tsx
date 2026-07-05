import { StyleSheet, Text, View } from 'react-native';
import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';
import { Button } from '@/components/ui/Button';
import { FadeInSection } from '@/components/ui/FadeInSection';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  emoji?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ title, subtitle, icon, emoji, ctaLabel, onCta }: EmptyStateProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <FadeInSection direction="up">
      <View style={styles.wrap}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: t.border }]}>
            <AroponIcon name={icon} size={48} />
          </View>
        ) : emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : null}
        <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: t.mutedDark }]}>{subtitle}</Text> : null}
        {ctaLabel && onCta ? (
          <Button label={ctaLabel} onPress={onCta} style={styles.cta} />
        ) : null}
      </View>
    </FadeInSection>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySm,
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.sm,
    minWidth: 200,
  },
});
