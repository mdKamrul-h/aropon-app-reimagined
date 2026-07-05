import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AroponLogo } from '@/components/brand/AroponLogo';
import { goBackOr } from '@/lib/navigation';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { colors, spacing, typography } from '@/constants/theme';

export type AppHeaderVariant = 'tabRoot' | 'stack' | 'ledger' | 'modal' | 'auth';

interface AppHeaderProps {
  variant?: AppHeaderVariant;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backFallback?: Href;
  ledgerPill?: boolean;
  shopName?: string;
  shopMeta?: string;
  syncLabel?: string;
  syncColor?: string;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
}

export function AppHeader({
  variant = 'stack',
  title,
  subtitle,
  showBack = variant !== 'tabRoot',
  backFallback = '/(tabs)',
  ledgerPill = variant === 'ledger',
  shopName,
  shopMeta,
  syncLabel,
  syncColor,
  left,
  right,
  children,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const isModal = variant === 'modal';
  const isAuth = variant === 'auth';

  if (isModal) {
    return (
      <View style={[styles.modalBar, { paddingTop: insets.top + spacing.sm, borderBottomColor: t.border }]}>
        <View style={styles.modalRow}>
          {showBack ? (
            <Pressable onPress={() => goBackOr(backFallback)} hitSlop={8} style={styles.backBtn}>
              <Text style={[styles.back, { color: t.ink }]}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={[styles.modalTitle, { color: t.ink }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.backPlaceholder}>{right}</View>
        </View>
      </View>
    );
  }

  const gradientColors = isAuth
    ? ([t.mood.accent, t.brand, t.mood.primary2] as const)
    : ([...t.headerGradient] as const);

  const titleColor = t.isDark && variant !== 'auth' ? t.ink : colors.white;
  const subColor = t.isDark && variant !== 'auth' ? t.muted : 'rgba(255,255,255,0.82)';

  return (
    <View>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.glowLarge} pointerEvents="none" />
        <View style={styles.glowSmall} pointerEvents="none" />

        {variant === 'tabRoot' ? (
          <View style={styles.tabTop}>
            <View style={styles.brandCluster}>
              {left ?? (
                <View style={[styles.logoTile, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  <AroponLogo size={34} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.shopName, { color: titleColor }]} numberOfLines={1}>
                  {shopName ?? title}
                </Text>
                {shopMeta ? (
                  <Text style={[styles.shopMeta, { color: subColor }]} numberOfLines={1}>
                    {shopMeta}
                  </Text>
                ) : null}
              </View>
            </View>
            {right}
          </View>
        ) : null}

        {variant === 'tabRoot' && children ? children : null}

        {variant !== 'tabRoot' ? (
          <View style={styles.row}>
            {showBack ? (
              <Pressable onPress={() => goBackOr(backFallback)} hitSlop={8} style={styles.backBtn}>
                <Text style={[styles.back, { color: titleColor }]}>←</Text>
              </Pressable>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <View style={styles.center}>
              <Text style={[styles.overline, { color: subColor }]}>আরোপন</Text>
            </View>
            {right ?? <View style={styles.backPlaceholder} />}
          </View>
        ) : null}

        {variant !== 'tabRoot' && title ? (
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.14)',
                borderColor: t.isDark ? t.borderStrong : 'rgba(255,255,255,0.18)',
              },
            ]}
          >
            {ledgerPill ? (
              <View style={[styles.ledgerPill, { borderColor: t.isDark ? t.borderStrong : 'rgba(255,255,255,0.16)' }]}>
                <Text style={[styles.ledgerPillText, { color: titleColor }]}>খাতা কেন্দ্র</Text>
              </View>
            ) : null}
            <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text> : null}
            {children}
          </View>
        ) : null}

        {syncLabel ? (
          <View style={[styles.syncPill, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
            <View style={[styles.syncDot, { backgroundColor: syncColor ?? t.syncOnline }]} />
            <Text style={[styles.syncText, { color: titleColor }]}>{syncLabel}</Text>
          </View>
        ) : null}
      </LinearGradient>
      {!isAuth ? <View style={[styles.goldAccent, { backgroundColor: t.brandGold }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  goldAccent: { height: 3, width: '100%' },
  glowLarge: {
    position: 'absolute',
    right: -46,
    top: -28,
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  glowSmall: {
    position: 'absolute',
    left: -18,
    bottom: -34,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(139,234,61,0.08)',
  },
  tabTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandCluster: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoTile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: { ...typography.screenTitle },
  shopMeta: { ...typography.caption },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  center: { flex: 1, alignItems: 'center' },
  backBtn: {
    minWidth: spacing.touchMin,
    minHeight: spacing.touchMin,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backPlaceholder: { width: spacing.touchMin },
  back: { fontSize: 24, lineHeight: 28 },
  overline: { ...typography.caption },
  heroCard: { borderRadius: 20, borderWidth: 1, padding: spacing.lg, gap: spacing.xs },
  ledgerPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.xs,
  },
  ledgerPillText: { ...typography.caption, fontFamily: typography.label.fontFamily },
  title: { ...typography.screenTitle },
  subtitle: { ...typography.caption },
  syncPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
  },
  syncDot: { width: 8, height: 8, borderRadius: 999 },
  syncText: { ...typography.caption },
  modalBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    backgroundColor: colors.white,
  },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  modalTitle: { ...typography.screenTitle, flex: 1, textAlign: 'center' },
});
