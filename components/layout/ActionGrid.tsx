import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { SectionBlock } from '@/components/layout/SectionBlock';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import {
  HOME_PRIMARY_ACTIONS,
  HOME_SERVICE_ACTIONS,
  isTabHref,
  type HomeQuickAction,
} from '@/constants/homeQuickActions';
import { spacing, typography } from '@/constants/theme';

function navigateAction(router: ReturnType<typeof useRouter>, href: HomeQuickAction['href']) {
  if (isTabHref(href)) router.replace(href as never);
  else router.push(href as never);
}

function ActionTile({
  action,
  variant,
  onPress,
}: {
  action: HomeQuickAction;
  variant: 'primary' | 'service';
  onPress: () => void;
}) {
  const { resolvedTheme: t } = useUiPreferences();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        isPrimary ? styles.primaryTile : styles.serviceTile,
        {
          backgroundColor: t.card,
          borderColor: t.border,
          borderRadius: isPrimary ? t.radiusXl : t.radiusLg,
        },
        Platform.OS === 'web' && styles.webPressable,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View
        style={[
          styles.iconWrap,
          {
            width: isPrimary ? 48 : 44,
            height: isPrimary ? 48 : 44,
            borderRadius: isPrimary ? 16 : 14,
            backgroundColor: t.surfaceMuted,
          },
        ]}
      >
        <AroponIcon name={action.icon} size={isPrimary ? 28 : 24} color={t.brand} />
      </View>
      <Text style={[isPrimary ? styles.primaryLabel : styles.serviceLabel, { color: t.ink }]} numberOfLines={1}>
        {action.label}
      </Text>
    </Pressable>
  );
}

interface ActionGridProps {
  showPrimary?: boolean;
  showService?: boolean;
  primaryTitle?: string;
  primaryMeta?: string;
  serviceTitle?: string;
  serviceMeta?: string;
}

export function ActionGrid({
  showPrimary = true,
  showService = true,
  primaryTitle = 'প্রধান কাজ',
  primaryMeta = 'এক ট্যাপে কাজ শুরু করুন',
  serviceTitle = 'আরও সেবা',
  serviceMeta = 'খাতা, স্টক আর রিপোর্ট',
}: ActionGridProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {showPrimary ? (
        <>
          <SectionBlock title={primaryTitle} meta={primaryMeta} icon="orders" />
          <View style={styles.primaryGrid}>
            {HOME_PRIMARY_ACTIONS.map((action) => (
              <ActionTile
                key={action.label}
                action={action}
                variant="primary"
                onPress={() => navigateAction(router, action.href)}
              />
            ))}
          </View>
        </>
      ) : null}
      {showService ? (
        <>
          <SectionBlock title={serviceTitle} meta={serviceMeta} icon="ledger" />
          <View style={styles.serviceGrid}>
            {HOME_SERVICE_ACTIONS.map((action) => (
              <ActionTile
                key={action.label}
                action={action}
                variant="service"
                onPress={() => navigateAction(router, action.href)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  primaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryTile: { width: '48%', borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  serviceTile: {
    width: '23%',
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { ...typography.sectionTitle },
  serviceLabel: { ...typography.caption, textAlign: 'center' },
  webPressable: Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {},
  pressed: { opacity: 0.88 },
});
