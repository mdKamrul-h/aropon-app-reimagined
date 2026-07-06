import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { Circle, G } from 'react-native-svg';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { paymentMethodLabel } from '@/constants/paymentMethods';
import { useAuth } from '@/context/AuthContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { useRepository } from '@/context/RepositoryContext';
import { PAYMENT_COLORS } from '@/lib/analytics/reportBuilder';
import { buildReportCsv, buildReportHtml } from '@/lib/export/reportExport';
import type { ReportSummary } from '@/types/schema';
import { formatTaka, toBnDigits } from '@/utils/bn-numerals';
import { fonts, radius, spacing, typography } from '@/constants/theme';

const RANGES = ['এই সপ্তাহ', 'এই মাস', 'এই বছর'];
const RANGE_DAYS = [7, 30, 365];

function DonutChart({
  segments,
  total,
}: {
  segments: { amount: number; color: string }[];
  total: number;
}) {
  const circ = 2 * Math.PI * 40;
  const els = segments.reduce<{ offset: number; els: ReactElement[] }>(
    (acc, e, i) => {
      const len = total > 0 ? (e.amount / total) * circ : 0;
      acc.els.push(
        <Circle
          key={i}
          cx={60}
          cy={60}
          r={40}
          stroke={e.color}
          strokeWidth={24}
          fill="none"
          strokeDasharray={`${len} ${circ - len}`}
          strokeDashoffset={-acc.offset}
        />,
      );
      acc.offset += len;
      return acc;
    },
    { offset: 0, els: [] },
  ).els;

  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <G transform="rotate(-90, 60, 60)">{els}</G>
    </Svg>
  );
}

function KpiCard({
  label,
  amount,
  color,
  suffix,
}: {
  label: string;
  amount?: number;
  color?: string;
  suffix?: string;
}) {
  const { resolvedTheme: t } = useUiPreferences();
  return (
    <SurfaceCard style={styles.kpiCard} padded>
      <Text style={[styles.kpiLabel, { color: t.muted }]}>{label}</Text>
      {amount !== undefined ? (
        <TakaAmount amount={amount} color={color ?? t.ink} size="sm" />
      ) : (
        <Text style={[styles.kpiSuffix, { color: color ?? t.ink }]}>{suffix}</Text>
      )}
    </SurfaceCard>
  );
}

export default function ReportsScreen() {
  const { business } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [range, setRange] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setReport(await repo.getReport(business.id, RANGE_DAYS[range]));
    setLoading(false);
  }, [business, repo, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDailySale = useMemo(
    () => Math.max(...(report?.dailySales.map((d) => d.amount) ?? [1]), 1),
    [report],
  );

  const profitDelta = report ? report.profit - report.prevPeriodProfit : 0;

  const shareReport = async () => {
    if (!report || !business) return;
    const text = [
      `${business.name} — রিপোর্ট (${RANGES[range]})`,
      `লাভ: ৳${toBnDigits(report.profit)}`,
      `বিক্রি: ৳${toBnDigits(report.sales)} · ক্রয়: ৳${toBnDigits(report.purchases)} · খরচ: ৳${toBnDigits(report.expenses)}`,
      `আদায়: ৳${toBnDigits(report.collections)} · মার্জিন: ${toBnDigits(report.profitMargin)}%`,
    ].join('\n');
    await Share.share({ message: text, title: 'আরোপন রিপোর্ট' });
  };

  const runExport = async (kind: 'csv' | 'pdf') => {
    if (!report || !business) return;
    const rangeLabel = RANGES[range];
    if (kind === 'csv') {
      const csv = buildReportCsv(report, rangeLabel);
      await Share.share({ message: csv, title: `${business.name}-report.csv` });
      return;
    }
    const html = buildReportHtml(report, rangeLabel, business);
    if (Platform.OS === 'web') {
      await Share.share({ message: html, title: `${business.name}-report.html` });
      return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'ঋণের জন্য রিপোর্ট (PDF)' });
    }
  };

  if (!business) return null;

  const paymentTotal = report?.paymentBreakdown.reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader
        title="রিপোর্ট"
        backFallback="/(tabs)/more"
        right={
          <Pressable onPress={shareReport} style={styles.shareBtn} disabled={!report}>
            <AroponIcon name="backup" size={22} />
          </Pressable>
        }
      >
        <View style={styles.rangeRow}>
          {RANGES.map((r, i) => (
            <Pressable
              key={r}
              onPress={() => setRange(i)}
              style={[
                styles.rangeChip,
                range === i && { backgroundColor: t.segmentActiveOnGradient },
              ]}
            >
              <Text
                style={[
                  styles.rangeText,
                  range === i && { color: t.ink },
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScreenHeader>

      {loading || !report ? (
        <ScreenLoader />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 100 }}>
          <View style={styles.exportBar}>
            <Pressable
              style={[styles.exportBtn, { backgroundColor: t.card, borderColor: t.brand }]}
              onPress={() => void runExport('csv')}
            >
              <Text style={[styles.exportBtnText, { color: t.brand }]}>Excel (CSV)</Text>
            </Pressable>
            <Pressable
              style={[styles.exportBtn, { backgroundColor: t.card, borderColor: t.brand }]}
              onPress={() => void runExport('pdf')}
            >
              <Text style={[styles.exportBtnText, { color: t.brand }]}>ঋণের জন্য PDF</Text>
            </Pressable>
          </View>

          <AnimatedSection index={0}>
          <SectionHeader icon="dashboard" title="সারাংশ" />
          <View style={[styles.plCard, { backgroundColor: t.brand }]}>
            <View style={styles.plHeader}>
              <Text style={styles.plLabel}>লাভ</Text>
              {profitDelta !== 0 ? (
                <Text style={styles.plDelta}>
                  {profitDelta > 0 ? '↑' : '↓'} {formatTaka(Math.abs(profitDelta))}
                </Text>
              ) : null}
            </View>
            <TakaAmount amount={report.profit} color="#fff" size="lg" />
            <Text style={styles.plBreak}>
              মার্জিন {toBnDigits(report.profitMargin)}% · বিক্রি {formatTaka(report.sales)}
            </Text>
          </View>
          </AnimatedSection>

          <AnimatedSection index={1}>
          <View style={styles.kpiGrid}>
            <KpiCard label="বিক্রি" amount={report.sales} color={t.brand} />
            <KpiCard label="ক্রয়" amount={report.purchases} />
            <KpiCard label="খরচ" amount={report.expenses} color={t.pay} />
            <KpiCard label="আদায়" amount={report.collections} color={t.receive} />
            <KpiCard
              label="লাভ মার্জিন"
              suffix={`${toBnDigits(report.profitMargin)}%`}
              color={t.brand}
            />
            <KpiCard label="মোট পাবেন" amount={report.totalReceivable} color={t.receive} />
          </View>
          </AnimatedSection>

          {report.grossMarginPercent !== null ? (
            <AnimatedSection index={2}>
              <SectionHeader icon="profit" title="প্রকৃত গ্রস মার্জিন (পণ্য অনুযায়ী)" />
              <SurfaceCard style={styles.marginCard}>
                <View style={styles.marginRow}>
                  <Text style={[styles.marginPct, { color: t.brand }]}>
                    {toBnDigits(report.grossMarginPercent)}%
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.marginLine, { color: t.ink }]}>
                      বিক্রি ৳{toBnDigits(Math.round(report.cogsSales))} · ক্রয়মূল্য ৳{toBnDigits(Math.round(report.cogs))}
                    </Text>
                    <Text style={[styles.marginHint, { color: t.muted }]}>
                      যেসব বিক্রিতে পণ্য বাছাই করা হয়েছিল, শুধু সেগুলোর ভিত্তিতে হিসাব করা
                    </Text>
                  </View>
                </View>
              </SurfaceCard>
            </AnimatedSection>
          ) : null}

          <AnimatedSection index={3}>
          <SectionHeader icon="profit" title="দৈনিক বিক্রি" />
          <SurfaceCard padded={false} style={styles.chart}>
            {report.dailySales.map((d) => (
              <View key={d.label} style={styles.barWrap}>
                <Text style={[styles.barAmount, { color: t.muted }]}>
                  {d.amount > 0 ? toBnDigits(Math.round(d.amount / 100) || d.amount) : ''}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(8, (d.amount / maxDailySale) * 88),
                      backgroundColor: t.brand,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: t.muted }]}>{d.label}</Text>
              </View>
            ))}
          </SurfaceCard>
          </AnimatedSection>

          {report.paymentBreakdown.length > 0 ? (
            <AnimatedSection index={3}>
              <SectionHeader icon="wallet" title="পেমেন্ট পদ্ধতি" />
              <SurfaceCard style={styles.pieRow}>
                <DonutChart
                  segments={report.paymentBreakdown.map((p) => ({
                    amount: p.amount,
                    color: PAYMENT_COLORS[p.method],
                  }))}
                  total={paymentTotal}
                />
                <View style={{ gap: spacing.sm, flex: 1 }}>
                  {report.paymentBreakdown.map((p) => (
                    <View key={p.method} style={styles.legendRow}>
                      <View
                        style={[styles.legendDot, { backgroundColor: PAYMENT_COLORS[p.method] }]}
                      />
                      <Text style={[styles.legendText, { color: t.ink }]}>{paymentMethodLabel(p.method)}</Text>
                      <TakaAmount amount={p.amount} size="sm" style={{ marginLeft: 'auto' }} />
                    </View>
                  ))}
                </View>
              </SurfaceCard>
            </AnimatedSection>
          ) : null}

          <AnimatedSection index={4}>
          <SectionHeader icon="receipt" title="খরচ বিভাজন" />
          <SurfaceCard style={styles.pieRow}>
            <DonutChart
              segments={report.expenseBreakdown.map((e) => ({
                amount: e.amount,
                color: e.color,
              }))}
              total={report.expenses}
            />
            <View style={{ gap: spacing.sm, flex: 1 }}>
              {report.expenseBreakdown.map((e) => (
                <View key={e.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: e.color }]} />
                  <Text style={[styles.legendText, { color: t.ink }]} numberOfLines={1}>
                    {e.label}
                  </Text>
                  <TakaAmount amount={e.amount} size="sm" style={{ marginLeft: 'auto' }} />
                </View>
              ))}
            </View>
          </SurfaceCard>
          </AnimatedSection>

          <AnimatedSection index={5}>
          <SectionHeader icon="customers" title="শীর্ষ বকেয়া (গ্রাহক)" />
          {report.topCustomers.length === 0 ? (
            <Text style={[styles.emptyHint, { color: t.muted }]}>কোনো বাকি নেই</Text>
          ) : (
            report.topCustomers.map((c, i) => (
              <SurfaceCard
                key={c.name}
                style={[
                  styles.topRow,
                  i === 0 && { borderColor: t.receive, backgroundColor: t.receiveTint },
                ]}
              >
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: t.cardTint },
                    i === 0 && { backgroundColor: t.amberTintBorder },
                  ]}
                >
                  <Text style={[styles.rank, { color: t.ink }]}>{toBnDigits(i + 1)}</Text>
                </View>
                <Text style={[styles.topName, { color: t.ink }]}>{c.name}</Text>
                <TakaAmount amount={c.amount} size="sm" color={t.receive} />
              </SurfaceCard>
            ))
          )}
          </AnimatedSection>

          {report.receivablesAging.some((b) => b.count > 0) ? (
            <AnimatedSection index={6}>
              <SectionHeader icon="customers" title="বকেয়ার বয়স" />
              <View style={styles.agingRow}>
                {report.receivablesAging.map((b) => (
                  <SurfaceCard key={b.bucket} style={styles.agingCard}>
                    <Text style={[styles.agingBucket, { color: t.muted }]}>{b.bucket}</Text>
                    <TakaAmount
                      amount={b.amount}
                      size="sm"
                      color={b.bucket === '৬০+ দিন' ? t.pay : t.ink}
                    />
                    <Text style={[styles.agingCount, { color: t.muted }]}>{toBnDigits(b.count)} জন</Text>
                  </SurfaceCard>
                ))}
              </View>
            </AnimatedSection>
          ) : null}
        </ScrollView>
      )}
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  shareBtn: { padding: spacing.xs },
  exportBar: { flexDirection: 'row', gap: spacing.sm },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  exportBtnText: { ...typography.label },
  marginCard: { gap: spacing.sm },
  marginRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  marginPct: { fontFamily: fonts.numeral, fontSize: 32 },
  marginLine: { ...typography.bodySm, fontFamily: fonts.bengaliSemiBold },
  marginHint: { ...typography.caption },
  agingRow: { flexDirection: 'row', gap: spacing.sm },
  agingCard: { flex: 1, gap: 4, alignItems: 'center' },
  agingBucket: { ...typography.caption },
  agingCount: { ...typography.caption },
  rangeRow: { flexDirection: 'row', gap: spacing.sm },
  rangeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rangeText: { ...typography.label, color: 'rgba(255,255,255,0.9)' },
  plCard: { borderRadius: radius.xl, padding: spacing.xxl, gap: spacing.sm },
  plHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plLabel: { ...typography.body, color: 'rgba(255,255,255,0.9)' },
  plDelta: { ...typography.caption, color: 'rgba(255,255,255,0.9)' },
  plBreak: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCard: {
    width: '31%',
    flexGrow: 1,
    gap: 4,
  },
  kpiLabel: { ...typography.caption },
  kpiSuffix: { fontFamily: fonts.numeral, fontSize: 18 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    padding: spacing.md,
  },
  barWrap: { alignItems: 'center', gap: 2, flex: 1 },
  barAmount: { ...typography.caption, fontSize: 9, height: 12 },
  bar: { width: 14, borderRadius: 4, minHeight: 8 },
  barLabel: { ...typography.caption },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...typography.caption, flex: 1 },
  emptyHint: { ...typography.bodySm, textAlign: 'center', padding: spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: { fontFamily: fonts.numeral, fontSize: 14 },
  topName: { ...typography.body, flex: 1, fontFamily: fonts.bengaliSemiBold },
});
