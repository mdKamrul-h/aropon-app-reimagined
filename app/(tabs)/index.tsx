import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSummarySection } from '@/components/home/DashboardSummarySection';
import { ActionGrid } from '@/components/layout/ActionGrid';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { FocusCard, type FocusItem } from '@/components/layout/FocusCard';
import { ListCard } from '@/components/layout/ListCard';
import { SectionBlock } from '@/components/layout/SectionBlock';
import { CreditScoreCard } from '@/components/score/CreditScoreCard';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { InsightBanner } from '@/components/ui/InsightBanner';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TierBadge } from '@/components/ui/TierBadge';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { usePremium } from '@/context/PremiumContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { DashboardSummary, Transaction } from '@/types/schema';
import type { CreditScoreSummary } from '@/types/creditScore';
import { spacing, typography } from '@/constants/theme';
import { formatBusinessLocation } from '@/utils/business';
import { formatTaka, toBnDigits } from '@/utils/bn-numerals';

export default function HomeScreen() {
  const router = useRouter();
  const { business, session } = useAuth();
  const { repo, syncState, refreshSync } = useRepository();
  const { isPremium } = usePremium();
  const { resolvedTheme: t } = useUiPreferences();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScoreSummary | null>(null);
  const [monthSales, setMonthSales] = useState(0);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) {
      setSummary(null);
      setCreditScore(null);
      setRecent([]);
      setMonthSales(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [dash, report, txs, score] = await Promise.all([
      repo.getDashboard(business.id),
      repo.getReport(business.id, 30),
      repo.getTransactions(business.id),
      repo.getCreditScoreSummary(business.id),
    ]);
    setSummary(dash);
    setMonthSales(report.sales);
    setRecent(txs.slice(0, 6));
    setCreditScore(score);
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

  const syncLabel = useMemo(() => {
    if (syncState === 'online') return 'সিঙ্ক ঠিক আছে';
    if (syncState === 'pending') return 'সিঙ্ক চলছে';
    return 'ইন্টারনেট নেই';
  }, [syncState]);

  const syncColor =
    syncState === 'online' ? t.syncOnline : syncState === 'pending' ? t.syncPending : t.syncOffline;

  const alertCount = (summary?.dueInstallmentCount ?? 0) + (summary?.lowStockCount ?? 0);

  const focusItems = useMemo(() => {
    if (!summary) return [] as FocusItem[];
    return [
      summary.lowStockCount
        ? { label: 'কম স্টক', value: `${toBnDigits(summary.lowStockCount)} টি`, route: '/(tabs)/inventory' }
        : null,
      summary.dueInstallmentCount
        ? { label: 'আজ কিস্তি', value: `${toBnDigits(summary.dueInstallmentCount)} টি`, route: '/loans' }
        : null,
      summary.totalReceivable > 0
        ? { label: 'আদায় বাকি', value: formatTaka(summary.totalReceivable), route: '/baki-khata' }
        : null,
    ].filter(Boolean) as FocusItem[];
  }, [summary]);

  const insightBody =
    (summary?.dueInstallmentCount ?? 0) > 0
      ? `${toBnDigits(summary?.dueInstallmentCount ?? 0)}টি কিস্তি আজ — সময়মতো পরিশোধ করলে ক্রেডিট স্কোর বাড়বে।`
      : creditScore
        ? `আপনার স্কোর ${toBnDigits(creditScore.score)} — উপরের ${toBnDigits(creditScore.percentile)}% ব্যবসায়ীর মধ্যে।`
        : 'আজকের হিসাব আপডেট রাখুন — স্কোর ও রিপোর্ট সঠিক থাকবে।';

  if (!session || !business) return null;

  if (loading && !summary) {
    return (
      <AppScreenShell variant="tabRoot">
        <ScreenLoader skeleton />
      </AppScreenShell>
    );
  }

  const bellButton = (
    <Pressable
      style={[styles.bellBtn, { backgroundColor: 'rgba(255,255,255,0.16)' }]}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications" size={22} color="#FFD54F" />
      {alertCount > 0 ? (
        <View style={[styles.bellBadge, { backgroundColor: t.amber }]}>
          <Text style={styles.bellBadgeText}>{alertCount > 9 ? '৯+' : toBnDigits(alertCount)}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <AppScreenShell variant="tabRoot">
      <AppHeader
        variant="tabRoot"
        shopName={business.name}
        shopMeta={formatBusinessLocation(business)}
        syncLabel={syncLabel}
        syncColor={syncColor}
        right={bellButton}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {isPremium ? <TierBadge /> : null}

        {summary ? (
          <DashboardSummarySection
            summary={summary}
            ownerName={business.owner_name ?? 'মালিক'}
            monthSales={monthSales}
          />
        ) : null}

        <ActionGrid />

        <FocusCard items={focusItems} alertCount={alertCount} />

        <InsightBanner title="ব্যবসা ইনসাইট" body={insightBody} />

        {creditScore ? <CreditScoreCard summary={creditScore} index={0} /> : null}

        <SectionBlock title="সাম্প্রতিক লেনদেন" icon="ledger" />
        {recent.length === 0 ? (
          <EmptyState title="এখনো কোনো লেনদেন নেই" icon="orders" />
        ) : (
          <ListCard>
            {recent.map((tx, index) => (
              <Pressable
                key={tx.id}
                style={[
                  styles.txRow,
                  { borderBottomColor: t.border },
                  index === recent.length - 1 && styles.lastRow,
                ]}
                onPress={() => router.push('/hisab-khata')}
              >
                <View style={[styles.txIcon, { backgroundColor: ['sale', 'payment_in'].includes(tx.type) ? t.successBg : t.errorBg }]}>
                  <AroponIcon name={tx.type === 'expense' ? 'expense' : 'orders'} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txTitle, { color: t.ink }]}>{tx.note ?? tx.type}</Text>
                  <Text style={[styles.txSub, { color: t.muted }]}>{tx.transaction_date}</Text>
                </View>
                <TakaAmount
                  amount={tx.amount}
                  color={['sale', 'payment_in'].includes(tx.type) ? t.receive : t.pay}
                  size="sm"
                />
              </Pressable>
            ))}
          </ListCard>
        )}
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 110 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 10, color: '#fff', lineHeight: 11 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  lastRow: { borderBottomWidth: 0 },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: { ...typography.bodySm },
  txSub: { ...typography.caption },
  webPress: Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {},
});
