import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AroponIcon } from '@/components/icons/AroponIcon';
import type { IconName } from '@/components/icons/aroponIconData';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { DashboardSummary } from '@/types/schema';
import { colors, fonts, spacing, typography } from '@/constants/theme';
import { formatTaka, getBnMonthLocative, toBnDigits } from '@/utils/bn-numerals';

interface DashboardSummarySectionProps {
  summary: DashboardSummary;
  ownerName: string;
  monthSales: number;
}

const ICON_SIZE = 32;

const TODAY_METRICS: {
  label: string;
  key: keyof Pick<
    DashboardSummary,
    'todaySales' | 'todayPurchases' | 'todayCollections' | 'todayExpenses'
  >;
  icon: IconName;
  colorKey: 'receive' | 'ink' | 'pay';
  tintKey: string;
}[] = [
  { label: 'বিক্রি', key: 'todaySales', icon: 'orders', colorKey: 'receive', tintKey: 'sale' },
  { label: 'ক্রয়', key: 'todayPurchases', icon: 'grocery', colorKey: 'ink', tintKey: 'purchase' },
  { label: 'আদায়', key: 'todayCollections', icon: 'wallet', colorKey: 'receive', tintKey: 'receive' },
  { label: 'খরচ', key: 'todayExpenses', icon: 'expense', colorKey: 'pay', tintKey: 'expense' },
];

export function DashboardSummarySection({ summary, ownerName, monthSales }: DashboardSummarySectionProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const delta = summary.todayDelta;
  const deltaPositive = delta >= 0;
  const monthLabel = getBnMonthLocative();
  const pad = spacing.lg * t.spacingScale;

  return (
    <View style={[styles.wrap, { gap: spacing.md * t.spacingScale }]}>
      <LinearGradient
        colors={[...t.heroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cashHero, { borderRadius: t.radiusXl, padding: pad }]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroGreeting}>
            <Text style={styles.greeting} numberOfLines={1}>
              শুভ দিন, {ownerName}
            </Text>
            <Text style={styles.monthHint}>
              {monthLabel} বিক্রি {formatTaka(monthSales)}
            </Text>
          </View>
          <View style={styles.takaBadge}>
            <Text style={styles.takaSymbol}>৳</Text>
          </View>
        </View>

        <View style={styles.cashBlock}>
          <View style={styles.cashRow}>
            <AroponIcon name="cash" size={ICON_SIZE} />
            <Text style={styles.cashLabel}>হাতে আছে</Text>
          </View>
          <TakaAmount amount={summary.cashInHand} size="hero" color={colors.white} />
          <View style={[styles.deltaPill, deltaPositive ? styles.deltaPillUp : styles.deltaPillDown]}>
            <Text style={styles.deltaCaption}>
              আজ {formatTaka(delta, { showSign: true })}
            </Text>
          </View>
        </View>

        <View style={styles.footerStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>কিস্তি আজ</Text>
            <Text style={styles.statValue}>{toBnDigits(summary.dueInstallmentCount)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>কম স্টক</Text>
            <Text style={styles.statValue}>{toBnDigits(summary.lowStockCount)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.balanceRow}>
        <SurfaceCard style={[styles.balanceCard, { borderLeftColor: colors.receive, borderLeftWidth: 3 }]}>
          <AroponIcon name="income" size={ICON_SIZE} />
          <Text style={[styles.balanceLabel, { color: t.muted }]}>পাবেন</Text>
          <Text style={[styles.balanceValue, { color: colors.receive }]}>
            {formatTaka(summary.totalReceivable)}
          </Text>
        </SurfaceCard>
        <SurfaceCard style={[styles.balanceCard, { borderLeftColor: colors.pay, borderLeftWidth: 3 }]}>
          <AroponIcon name="expense" size={ICON_SIZE} />
          <Text style={[styles.balanceLabel, { color: t.muted }]}>দিবেন</Text>
          <Text style={[styles.balanceValue, { color: colors.pay }]}>
            {formatTaka(summary.totalPayable)}
          </Text>
        </SurfaceCard>
      </View>

      <SurfaceCard style={{ borderRadius: t.radiusXl }}>
        <Text style={[styles.todayTitle, { color: t.ink }]}>আজকের হিসাব</Text>
        {TODAY_METRICS.map((m, i) => {
          const color = m.colorKey === 'receive' ? colors.receive : m.colorKey === 'pay' ? colors.pay : t.ink;
          return (
            <View
              key={m.key}
              style={[styles.todayRow, i < TODAY_METRICS.length - 1 && { borderBottomColor: t.border, borderBottomWidth: 1 }]}
            >
              <View style={[styles.todayIconWrap, { backgroundColor: t.quickActionTints[m.tintKey] }]}>
                <AroponIcon name={m.icon} size={24} />
              </View>
              <Text style={[styles.todayLabel, { color: t.ink }]}>{m.label}</Text>
              <Text style={[styles.todayValue, { color }]}>{formatTaka(summary[m.key])}</Text>
            </View>
          );
        })}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  cashHero: { gap: spacing.md, overflow: 'hidden' },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  heroGreeting: { flex: 1, gap: 2 },
  greeting: { ...typography.sectionTitle, color: 'rgba(255,255,255,0.95)' },
  monthHint: { ...typography.caption, color: 'rgba(255,255,255,0.75)' },
  takaBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takaSymbol: { fontFamily: fonts.numeral, fontSize: 22, color: '#FFD54F' },
  cashBlock: { alignItems: 'center', gap: spacing.xs, width: '100%' },
  cashRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cashLabel: { ...typography.label, color: 'rgba(255,255,255,0.90)' },
  deltaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: spacing.xs,
  },
  deltaPillUp: { backgroundColor: 'rgba(255,255,255,0.15)' },
  deltaPillDown: { backgroundColor: 'rgba(255,100,100,0.20)' },
  deltaCaption: { ...typography.caption, fontFamily: fonts.bengaliSemiBold, color: 'rgba(255,255,255,0.90)' },
  footerStats: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: spacing.md,
    width: '100%',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: 2 },
  statLabel: { ...typography.caption, color: 'rgba(255,255,255,0.80)' },
  statValue: { fontFamily: fonts.numeral, fontSize: 22, color: '#fff' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.20)' },
  balanceRow: { flexDirection: 'row', gap: spacing.sm },
  balanceCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  balanceLabel: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },
  balanceValue: { fontFamily: fonts.numeral, fontSize: 26, lineHeight: 32 },
  todayTitle: { ...typography.label, marginBottom: spacing.xs, fontFamily: fonts.bengaliBold },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  todayIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  todayLabel: { ...typography.bodySm, flex: 1 },
  todayValue: { fontFamily: fonts.numeral, fontSize: 19, lineHeight: 26 },
});
