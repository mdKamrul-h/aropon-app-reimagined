import { useEffect, useMemo, useState } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

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

  computeInstallmentSchedule,

  loanPaidAmount,

  loanTotalRepayable,

  nextInstallment,

  type InstallmentStatus,

} from '@/lib/loans/installmentSchedule';

import type { Loan } from '@/types/schema';

import { toBnDigits } from '@/utils/bn-numerals';

import { fonts, radius, spacing, typography } from '@/constants/theme';



const STATUS_LABELS: Record<InstallmentStatus, string> = {

  paid: 'পরিশোধিত',

  overdue: 'বকেয়া',

  due: 'পরিশোধ',

  upcoming: 'আসছে',

};



export default function LoanDetailScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { business } = useAuth();

  const { repo } = useRepository();

  const { showSuccess } = useToast();

  const { resolvedTheme: t } = useUiPreferences();

  const [loan, setLoan] = useState<Loan | null>(null);

  const [loading, setLoading] = useState(true);

  const [scheduleOpen, setScheduleOpen] = useState(true);

  const [paying, setPaying] = useState(false);



  const statusColors = useMemo(

    (): Record<InstallmentStatus, string> => ({

      paid: t.receive,

      overdue: t.pay,

      due: t.brand,

      upcoming: t.muted,

    }),

    [t],

  );



  useEffect(() => {

    if (!business || !id) return;

    setLoading(true);

    repo.getLoans(business.id).then((loans) => {

      setLoan(loans.find((l) => l.id === String(id)) ?? null);

      setLoading(false);

    });

  }, [business, id, repo]);



  const schedule = loan ? computeInstallmentSchedule(loan) : [];

  const next = loan ? nextInstallment(loan) : null;

  const paid = loan ? loanPaidAmount(loan) : 0;

  const total = loan ? loanTotalRepayable(loan) : 0;

  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;



  const pay = async () => {

    if (!loan || loan.principal <= 0) {

      router.push('/loan/new');

      return;

    }

    setPaying(true);

    const remaining = loan.total_installments - loan.paid_installments;

    const amount = remaining > 0 ? loan.outstanding / remaining : loan.outstanding;

    await repo.payInstallment(loan.id, amount);

    showSuccess('কিস্তি পরিশোধ হয়েছে');

    if (business) {

      const loans = await repo.getLoans(business.id);

      setLoan(loans.find((l) => l.id === loan.id) ?? null);

    }

    setPaying(false);

  };



  if (loading) {

    return (

      <TabScreenShell>

        <ScreenHeader title="লোন বিস্তারিত" backFallback="/loans" />

        <ScreenLoader />

      </TabScreenShell>

    );

  }



  if (!loan) return null;



  const isDraft = loan.principal === 0;



  return (

    <TabScreenShell>

    <View style={{ flex: 1, paddingBottom: insets.bottom }}>

      <ScreenHeader title={loan.lender_name} backFallback="/loans" />



      <ScrollView contentContainerStyle={styles.content}>

        {isDraft ? (

          <SurfaceCard style={styles.draftCard}>

            <Text style={[styles.draftHint, { color: t.muted }]}>লোনের বিস্তারিত এখনো যোগ করা হয়নি</Text>

            <Button label="বিস্তারিত যোগ করুন" onPress={() => router.push('/loan/new')} />

          </SurfaceCard>

        ) : (

          <>

            <SurfaceCard style={styles.headerCard}>

              <Text style={[styles.typeTag, { color: t.brand, backgroundColor: t.cardTint }]}>

                {loan.loan_type}

              </Text>

              <Text style={[styles.meta, { color: t.muted }]}>

                মূল ৳{toBnDigits(loan.principal)} · {toBnDigits(loan.total_installments)} কিস্তি

              </Text>

              <Text style={[styles.progressLabel, { color: t.mutedDark }]}>পরিশোধ অগ্রগতি</Text>

              <View style={[styles.progressBg, { backgroundColor: t.border }]}>

                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: t.brand }]} />

              </View>

              <Text style={[styles.progressText, { color: t.muted }]}>

                ৳{toBnDigits(paid)} / ৳{toBnDigits(total)} · {toBnDigits(pct)}%

              </Text>

            </SurfaceCard>



            {next ? (

              <SurfaceCard style={[styles.nextCard, { backgroundColor: t.receiveTint, borderColor: t.receiveTintBorder }]}>

                <Text style={[styles.nextLabel, { color: t.mutedDark }]}>পরবর্তী কিস্তি</Text>

                <TakaAmount amount={next.amount} size="lg" color={t.brand} />

                <Text style={[styles.nextDate, { color: t.inkSecondary }]}>{next.dueDate}</Text>

                <Button label="কিস্তি পরিশোধ" onPress={pay} loading={paying} />

              </SurfaceCard>

            ) : null}



            <Pressable style={styles.scheduleToggle} onPress={() => setScheduleOpen((o) => !o)}>

              <Text style={[styles.scheduleTitle, { color: t.ink }]}>

                সম্পূর্ণ কিস্তি সূচি ({toBnDigits(schedule.length)}টি) {scheduleOpen ? '▲' : '▼'}

              </Text>

            </Pressable>



            {scheduleOpen

              ? schedule.map((inst) => (

                  <SurfaceCard key={inst.index} style={styles.instRow}>

                    <View style={[styles.statusDot, { backgroundColor: statusColors[inst.status] }]}>

                      <Text style={styles.statusIcon}>

                        {inst.status === 'paid' ? '✓' : inst.status === 'overdue' ? '!' : '·'}

                      </Text>

                    </View>

                    <View style={styles.instBody}>

                      <Text style={[styles.instTitle, { color: t.ink }]}>

                        কিস্তি #{toBnDigits(inst.index)} · ৳{toBnDigits(inst.amount)}

                      </Text>

                      <Text style={[styles.instMeta, { color: t.muted }]}>

                        নির্ধারিত: {inst.dueDate}

                        {inst.paidDate ? ` · পরিশোধ: ${inst.paidDate}` : ''}

                      </Text>

                    </View>

                    {inst.status === 'due' || inst.status === 'overdue' ? (

                      <Pressable

                        style={[

                          styles.payChip,

                          { backgroundColor: inst.status === 'overdue' ? t.pay : t.brand },

                        ]}

                        onPress={pay}

                      >

                        <Text style={styles.payChipText}>{STATUS_LABELS[inst.status]}</Text>

                      </Pressable>

                    ) : (

                      <Text style={[styles.statusLabel, { color: statusColors[inst.status] }]}>

                        {STATUS_LABELS[inst.status]}

                      </Text>

                    )}

                  </SurfaceCard>

                ))

              : null}

          </>

        )}

      </ScrollView>

    </View>

    </TabScreenShell>

  );

}



const styles = StyleSheet.create({

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

  draftCard: {

    gap: spacing.md,

    alignItems: 'center',

  },

  draftHint: { ...typography.bodySm },

  headerCard: { gap: spacing.sm },

  typeTag: {

    ...typography.caption,

    alignSelf: 'flex-start',

    paddingHorizontal: spacing.sm,

    paddingVertical: 2,

    borderRadius: radius.pill,

  },

  meta: { ...typography.bodySm },

  progressLabel: { ...typography.label, marginTop: spacing.sm },

  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },

  progressFill: { height: 8 },

  progressText: { ...typography.caption },

  nextCard: {

    gap: spacing.sm,

    alignItems: 'center',

    borderWidth: 1,

  },

  nextLabel: { ...typography.label },

  nextDate: { ...typography.caption },

  scheduleToggle: { paddingVertical: spacing.sm },

  scheduleTitle: { ...typography.sectionTitle },

  instRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.md,

  },

  statusDot: {

    width: 32,

    height: 32,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

  },

  statusIcon: { color: '#fff', fontFamily: fonts.bengaliBold, fontSize: 16 },

  instBody: { flex: 1, gap: 2 },

  instTitle: { ...typography.bodySm, fontFamily: fonts.bengaliSemiBold },

  instMeta: { ...typography.caption },

  payChip: {

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    borderRadius: radius.pill,

  },

  payChipText: { ...typography.caption, color: '#fff', fontFamily: fonts.bengaliSemiBold },

  statusLabel: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },

});

