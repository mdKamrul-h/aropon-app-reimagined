import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import {
  loanPaidAmount,
  nextInstallment,
  onTimeRatePercent,
  overdueInstallments,
} from '@/lib/loans/installmentSchedule';
import type { Installment, Loan, LoanPayment } from '@/types/schema';
import { todayISO, toBnDigits } from '@/utils/bn-numerals';
import { fonts, radius, spacing, typography } from '@/constants/theme';

export default function LoansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { showSuccess } = useToast();
  const { resolvedTheme: t } = useUiPreferences();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installmentsByLoan, setInstallmentsByLoan] = useState<Record<string, Installment[]>>({});
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [segment, setSegment] = useState<'active' | 'paid'>('active');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const loanList = await repo.getLoans(business.id);
    setLoans(loanList);
    const entries = await Promise.all(
      loanList.map(async (l) => [l.id, await repo.getInstallments(l.id)] as const),
    );
    setInstallmentsByLoan(Object.fromEntries(entries));
    setPayments(await repo.getLoanPayments(business.id));
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = loans.filter((l) => l.status === segment);
  const overdue = useMemo(
    () => overdueInstallments(loans, installmentsByLoan),
    [loans, installmentsByLoan],
  );
  const totalBorrowed = loans.reduce((s, l) => s + (l.principal || 0), 0);
  const totalPaid = loans.reduce((s, l) => s + loanPaidAmount(l, installmentsByLoan[l.id] ?? []), 0);
  const totalDue = loans
    .filter((l) => l.status === 'active')
    .reduce((s, l) => s + l.outstanding, 0);
  const onTimeRate = onTimeRatePercent(payments);

  const pay = async (loan: Loan) => {
    await repo.payInstallment(loan.id);
    showSuccess('কিস্তি পরিশোধ হয়েছে');
    await load();
  };

  const today = todayISO();

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader title="লোন ও কিস্তি" backFallback="/(tabs)/more" />
      {loading ? (
        <ScreenLoader />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
          {overdue.length > 0 ? (
            <Pressable
              style={[styles.alertBanner, { backgroundColor: t.payTint, borderColor: t.payTintBorder }]}
              onPress={() => router.push({ pathname: '/loan/[id]', params: { id: overdue[0].loan.id } } as never)}
            >
              <Text style={[styles.alertText, { color: t.pay }]}>
                {toBnDigits(overdue.length)}টি কিস্তি বকেয়া — ৳{toBnDigits(Math.round(overdue[0].inst.amount))}
              </Text>
              <Text style={[styles.alertSub, { color: t.mutedDark }]}>দ্রুত পরিশোধ করুন</Text>
            </Pressable>
          ) : null}

          <View style={styles.summaryRow}>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: t.muted }]}>মোট গৃহীত</Text>
              <TakaAmount amount={totalBorrowed} size="sm" />
            </SurfaceCard>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: t.muted }]}>পরিশোধিত</Text>
              <TakaAmount amount={Math.round(totalPaid)} color={t.receive} size="sm" />
            </SurfaceCard>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: t.muted }]}>মোট বকেয়া</Text>
              <TakaAmount amount={totalDue} color={t.pay} size="sm" />
            </SurfaceCard>
            <SurfaceCard style={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: t.muted }]}>সময়মতো পরিশোধ</Text>
              <Text style={[styles.rateText, { color: t.brand }]}>
                {onTimeRate === null ? '—' : `${toBnDigits(onTimeRate)}%`}
              </Text>
            </SurfaceCard>
          </View>

          <View style={styles.segments}>
            {(['active', 'paid'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSegment(s)}
                style={[
                  styles.seg,
                  {
                    backgroundColor: segment === s ? t.segmentActive : t.card,
                    borderColor: segment === s ? t.brand : t.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segText,
                    { color: segment === s ? t.brand : t.mutedDark },
                  ]}
                >
                  {s === 'active' ? 'চলমান' : 'পরিশোধিত'}
                </Text>
              </Pressable>
            ))}
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              icon="profit"
              title={segment === 'active' ? 'কোনো চলমান লোন নেই' : 'পরিশোধিত লোন নেই'}
              ctaLabel={segment === 'active' ? '+ নতুন লোন' : undefined}
              onCta={segment === 'active' ? () => router.push('/loan/new') : undefined}
            />
          ) : (
            filtered.map((loan) => {
              const isDraft = loan.principal === 0;
              if (isDraft) {
                return (
                  <SurfaceCard key={loan.id} style={styles.card}>
                    <Text style={[styles.lender, { color: t.ink }]}>{loan.lender_name}</Text>
                    <Text style={[styles.type, { color: t.muted }]}>{loan.loan_type}</Text>
                    <Text style={[styles.draftHint, { color: t.muted }]}>লোনের বিস্তারিত এখনো যোগ করা হয়নি</Text>
                    <Button label="বিস্তারিত যোগ করুন" onPress={() => router.push('/loan/new')} />
                  </SurfaceCard>
                );
              }

              const pct =
                loan.total_installments > 0
                  ? Math.round((loan.paid_installments / loan.total_installments) * 100)
                  : 0;
              const next = nextInstallment(loan, installmentsByLoan[loan.id] ?? []);
              const dueToday = loan.next_due_date === today;

              return (
                <Pressable
                  key={loan.id}
                  onPress={() => router.push({ pathname: '/loan/[id]', params: { id: loan.id } } as never)}
                >
                  <SurfaceCard style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.lender, { color: t.ink }]}>{loan.lender_name}</Text>
                      <Text style={[styles.typeTag, { color: t.brand, backgroundColor: t.cardTint }]}>
                        {loan.loan_type}
                      </Text>
                    </View>
                    <TakaAmount amount={loan.outstanding} color={t.pay} />
                    {next ? (
                      <Text style={[styles.due, { color: t.inkSecondary }]}>
                        পরবর্তী কিস্তি: ৳{toBnDigits(Math.round(next.amount))} · {next.dueDate}
                      </Text>
                    ) : loan.next_due_date ? (
                      <Text style={[styles.due, { color: t.inkSecondary }]}>পরবর্তী কিস্তি: {loan.next_due_date}</Text>
                    ) : null}
                    <View style={[styles.progressBg, { backgroundColor: t.border }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: t.brand }]} />
                    </View>
                    <Text style={[styles.progressText, { color: t.muted }]}>
                      {toBnDigits(loan.paid_installments)}/{toBnDigits(loan.total_installments)} · {toBnDigits(pct)}%
                    </Text>
                    {segment === 'active' ? (
                      <Button
                        label="কিস্তি পরিশোধ করুন"
                        variant={dueToday ? 'primary' : 'outline'}
                        onPress={() => pay(loan)}
                      />
                    ) : null}
                  </SurfaceCard>
                </Pressable>
              );
            })
          )}

          <Pressable
            style={[styles.addTile, { borderColor: t.brand }]}
            onPress={() => router.push('/loan/new')}
          >
            <Text style={[styles.addText, { color: t.brand }]}>+ নতুন লোন</Text>
          </Pressable>
        </ScrollView>
      )}
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  alertBanner: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  alertText: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  alertSub: { ...typography.caption },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  summaryLabel: { ...typography.caption },
  rateText: { fontFamily: fonts.numeral, fontSize: 22 },
  segments: { flexDirection: 'row', gap: spacing.sm },
  seg: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  segText: { ...typography.caption },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lender: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  type: { ...typography.caption },
  typeTag: {
    ...typography.caption,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  draftHint: { ...typography.bodySm },
  due: { ...typography.caption },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8 },
  progressText: { ...typography.caption },
  addTile: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  addText: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
});
