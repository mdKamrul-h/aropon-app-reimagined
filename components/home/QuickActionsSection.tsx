import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import {
  HOME_PRIMARY_ACTIONS,
  HOME_SERVICE_ACTIONS,
  isTabHref,
  type HomeQuickAction,
} from '@/constants/homeQuickActions';
import { spacing, typography } from '@/constants/theme';

function navigateAction(router: ReturnType<typeof useRouter>, href: HomeQuickAction['href']) {
  if (isTabHref(href)) {
    router.replace(href as never);
  } else {
    router.push(href as never);
  }
}

interface ActionTileProps {
  action: HomeQuickAction;
  variant: 'primary' | 'service';
  onPress: () => void;
}

function ActionTile({ action, variant, onPress }: ActionTileProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const isPrimary = variant === 'primary';
  const iconSize = isPrimary ? 28 : 24;
  const iconWrapSize = isPrimary ? 48 : 44;
  const iconRadius = isPrimary ? 16 : 14;

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
            width: iconWrapSize,
            height: iconWrapSize,
            borderRadius: iconRadius,
            backgroundColor: t.isDark ? t.cardTint : '#FAFAF7',
          },
        ]}
      >
        <AroponIcon name={action.icon} size={iconSize} color={t.brand} />
      </View>
      <Text
        style={[
          isPrimary ? styles.primaryLabel : styles.serviceLabel,
          { color: t.ink },
        ]}
        numberOfLines={1}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

export function QuickActionsSection() {
  const router = useRouter();
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.ink }]}>প্রধান কাজ</Text>
        <Text style={[styles.sectionMeta, { color: t.muted }]}>এক ট্যাপে কাজ শুরু করুন</Text>
      </View>
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

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: t.ink }]}>আরও সেবা</Text>
        <Text style={[styles.sectionMeta, { color: t.muted }]}>খাতা, স্টক আর রিপোর্ট</Text>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    fontFamily: typography.sectionTitle.fontFamily,
  },
  sectionMeta: {
    ...typography.caption,
    flexShrink: 1,
    textAlign: 'right',
  },
  primaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryTile: {
    width: '48%',
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceTile: {
    width: '23%',
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    ...typography.sectionTitle,
  },
  serviceLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  webPressable: Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {},
  pressed: { opacity: 0.88 },
});
