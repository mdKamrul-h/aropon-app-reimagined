import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Href } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import type { TabShellActive } from '@/constants/navigation';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { radius, spacing, typography } from '@/constants/theme';

interface HisabDarkScreenProps {
  title: string;
  subtitle?: string;
  heroLabel?: string;
  tabActive?: TabShellActive | null;
  showBack?: boolean;
  backFallback?: Href;
  right?: ReactNode;
  children: ReactNode;
}

export function useHisabScreenStyles() {
  const { resolvedTheme: t } = useUiPreferences();

  return useMemo(
    () =>
      StyleSheet.create({
        statGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        statCard: {
          flexBasis: '48%',
          flexGrow: 1,
          backgroundColor: t.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: t.border,
          padding: spacing.lg,
          gap: 6,
        },
        statLabel: {
          ...typography.caption,
          color: t.mutedDark,
        },
        statValue: {
          ...typography.cardAmount,
          color: t.ink,
        },
        statHint: {
          ...typography.caption,
          color: t.muted,
        },
        listCard: {
          backgroundColor: t.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: t.border,
          overflow: 'hidden',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        },
        rowTitle: {
          ...typography.body,
          color: t.ink,
        },
        rowMeta: {
          ...typography.caption,
          color: t.mutedDark,
        },
        sectionTitle: {
          ...typography.sectionTitle,
          color: t.ink,
        },
        pill: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: t.isDark ? t.surfaceMuted : t.surfaceAlt,
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: t.border,
        },
        pillText: {
          ...typography.caption,
          color: t.brand,
        },
        sectionCard: {
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.md,
        },
      }),
    [t],
  );
}

export function HisabDarkScreen({
  title,
  subtitle,
  tabActive = 'accounting',
  showBack = true,
  backFallback = '/(tabs)/accounting',
  right,
  children,
}: HisabDarkScreenProps) {
  const { resolvedTheme: t } = useUiPreferences();

  const body = (
    <>
      <AppHeader
        variant="ledger"
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        backFallback={backFallback}
        right={right}
        ledgerPill
      />
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: t.surface }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </>
  );

  if (tabActive === null) {
    return (
      <AppScreenShell variant="ledger">{body}</AppScreenShell>
    );
  }

  return (
    <AppScreenShell variant="ledger" withNav tabActive={tabActive}>
      {body}
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
});
