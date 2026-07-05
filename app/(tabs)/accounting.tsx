import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AroponLogo } from '@/components/brand/AroponLogo';
import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';
import { AppCard } from '@/components/layout/AppCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { SectionBlock } from '@/components/layout/SectionBlock';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { DashboardSummary } from '@/types/schema';
import { spacing, typography } from '@/constants/theme';
import { formatTaka, toBnDigits } from '@/utils/bn-numerals';

const DESTINATIONS: {
  title: string;
  subtitle: string;
  route: string;
  icon: IconName;
  tintKey: string;
}[] = [
  { title: 'হিসাব খাতা', subtitle: 'ক্যাশবুক ও লেনদেন', route: '/hisab-khata', icon: 'ledger', tintKey: 'sale' },
  { title: 'বাকি খাতা', subtitle: 'গ্রাহক ও ডিলারের বাকি', route: '/baki-khata', icon: 'receipt', tintKey: 'party' },
  { title: 'স্টক খাতা', subtitle: 'পণ্য ও স্টক', route: '/stock-khata', icon: 'inventory', tintKey: 'receive' },
  { title: 'খরচ খাতা', subtitle: 'ব্যবসার খরচ', route: '/koroch-khata', icon: 'wallet', tintKey: 'expense' },
  { title: 'গ্রাহক খাতা', subtitle: 'নাম ধরে বাকি', route: '/khata', icon: 'customers', tintKey: 'party' },
  { title: 'রিপোর্ট', subtitle: 'লাভ-ক্ষতি', route: '/reports', icon: 'profit', tintKey: 'sale' },
];

export default function AccountingHubScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { repo, refreshSync } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setSummary(await repo.getDashboard(business.id));
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSync();
    await load();
    setRefreshing(false);
  };

  if (!business) return null;

  if (loading && !summary) {
    return (
      <AppScreenShell variant="tabRoot">
        <ScreenLoader />
      </AppScreenShell>
    );
  }

  const reportBtn = (
    <Pressable
      style={[styles.reportBtn, { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.12)' }]}
      onPress={() => router.push('/reports')}
    >
      <AroponIcon name="profit" size={22} color={t.isDark ? t.iconPrimary : '#fff'} />
    </Pressable>
  );

  return (
    <AppScreenShell variant="tabRoot">
      <AppHeader
        variant="ledger"
        title="হিসাব"
        subtitle={`${business.name} এর খাতা কেন্দ্র`}
        showBack={false}
        ledgerPill
        right={reportBtn}
      >
        <View style={styles.heroLogoRow}>
          <View style={[styles.logoTile, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <AroponLogo size={36} />
          </View>
        </View>
      </AppHeader>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
      >
        <Pressable
          style={[styles.cashbookShortcut, { backgroundColor: t.brand, borderRadius: t.radiusLg }]}
          onPress={() => router.push('/hisab-khata')}
        >
          <AroponIcon name="ledger" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>সরাসরি ক্যাশবুক</Text>
            <Text style={styles.shortcutSub}>আজকের লেনদেন দেখুন ও দিন শেষ করুন</Text>
          </View>
          <Text style={styles.shortcutArrow}>→</Text>
        </Pressable>

        {summary ? (
          <>
            <View style={styles.statGrid}>
              <AppCard style={styles.statCard}>
                <Text style={[styles.statLabel, { color: t.muted }]}>নগদ আছে</Text>
                <TakaAmount amount={summary.cashInHand} color={t.brand} size="card" />
              </AppCard>
              <AppCard style={styles.statCard}>
                <Text style={[styles.statLabel, { color: t.muted }]}>পাবেন</Text>
                <TakaAmount amount={summary.totalReceivable} color={t.receive} size="card" />
              </AppCard>
              <AppCard style={styles.statCard}>
                <Text style={[styles.statLabel, { color: t.muted }]}>দিবেন</Text>
                <TakaAmount amount={summary.totalPayable} color={t.pay} size="card" />
              </AppCard>
              <AppCard style={styles.statCard}>
                <Text style={[styles.statLabel, { color: t.muted }]}>কম স্টক</Text>
                <Text style={[styles.statCount, { color: summary.lowStockCount > 0 ? t.amber : t.ink }]}>
                  {toBnDigits(summary.lowStockCount)}
                </Text>
              </AppCard>
            </View>

            <AppCard padded={false} tint={t.isDark ? t.card : '#F4F8FC'}>
              <Pressable onPress={() => setSummaryExpanded((v) => !v)}>
                <LinearGradient
                  colors={t.isDark ? [t.cardTint, t.surfaceMuted] : ['#F6FAFF', '#EEF5FF']}
                  style={[styles.bannerInner, { borderRadius: t.radiusXl }]}
                >
                  <View style={styles.bannerTop}>
                    <Text style={[styles.bannerEyebrow, { color: t.brand }]}>আজকের সারাংশ</Text>
                    <Text style={{ color: summary.todayDelta >= 0 ? t.receive : t.pay, ...typography.label }}>
                      {formatTaka(summary.todayDelta, { showSign: true })}
                    </Text>
                    <Text style={{ color: t.muted }}>{summaryExpanded ? '▴' : '▾'}</Text>
                  </View>
                  {summaryExpanded ? (
                    <View style={styles.bannerMetrics}>
                      {[
                        ['বিক্রি', summary.todaySales, t.receive],
                        ['আদায়', summary.todayCollections, t.receive],
                        ['খরচ', summary.todayExpenses, t.pay],
                        ['ক্রয়', summary.todayPurchases, t.ink],
                      ].map(([label, amount, color]) => (
                        <View key={label as string} style={[styles.metricCard, { borderColor: t.border, backgroundColor: t.card }]}>
                          <Text style={[styles.statLabel, { color: t.muted }]}>{label}</Text>
                          <TakaAmount amount={amount as number} color={color as string} size="sm" />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </LinearGradient>
              </Pressable>
            </AppCard>
          </>
        ) : null}

        <SectionBlock title="হিসাবের পেজ" icon="ledger" />

        <View style={styles.grid}>
          {DESTINATIONS.map((item) => (
            <Pressable
              key={item.route}
              style={[
                styles.tile,
                {
                  backgroundColor: t.isDark ? t.card : t.quickActionTints[item.tintKey],
                  borderColor: t.border,
                  borderRadius: t.radiusLg,
                },
                Platform.OS === 'web' && styles.webTile,
              ]}
              onPress={() => router.push(item.route as never)}
            >
              <View style={[styles.tileIcon, { backgroundColor: t.surfaceMuted }]}>
                <AroponIcon name={item.icon} size={28} color={t.brand} />
              </View>
              <Text style={[styles.tileTitle, { color: t.ink }]}>{item.title}</Text>
              <Text style={[styles.tileSub, { color: t.muted }]}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 110 },
  heroLogoRow: { flexDirection: 'row', marginBottom: spacing.xs },
  logoTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reportBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cashbookShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  shortcutTitle: { ...typography.sectionTitle, color: '#fff' },
  shortcutSub: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  shortcutArrow: { fontSize: 22, color: '#fff' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { width: '48%', gap: 4 },
  statLabel: { ...typography.caption },
  statCount: { ...typography.cardAmount },
  bannerInner: { padding: spacing.lg, gap: spacing.md },
  bannerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  bannerEyebrow: { ...typography.caption, flex: 1 },
  bannerMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricCard: { width: '48%', borderRadius: 12, padding: spacing.md, gap: 4, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '48%', borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  tileIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { ...typography.sectionTitle },
  tileSub: { ...typography.caption, minHeight: 36 },
  webTile: Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {},
});
