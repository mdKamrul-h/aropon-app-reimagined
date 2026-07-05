import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { InsightBanner } from '@/components/ui/InsightBanner';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { ScoreGauge } from '@/components/score/ScoreGauge';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import {
  bandColorToken,
  confidenceLabelBn,
  confidenceLabelEn,
} from '@/lib/scoring/bandColors';
import type { CreditScoreFlag, CreditScoreSummary } from '@/types/creditScore';
import { bandGradients, colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { toBnDigits } from '@/utils/bn-numerals';

function FlagList({
  flags,
  variant,
  language,
}: {
  flags: CreditScoreFlag[];
  variant: 'green' | 'red';
  language: 'bn' | 'en';
}) {
  const { resolvedTheme: t } = useUiPreferences();
  if (flags.length === 0) return null;

  const greenBg = t.receiveTint;
  const redBg = t.payTint;
  const greenBorder = t.receiveTintBorder;
  const redBorder = t.payTintBorder;
  const tint = variant === 'green' ? greenBg : redBg;
  const border = variant === 'green' ? greenBorder : redBorder;

  return (
    <View style={styles.flagList}>
      {flags.map((f, i) => (
        <AnimatedSection key={f.message_key} index={i} direction="up">
          <View
            style={[
              styles.flagItem,
              { backgroundColor: tint, borderColor: border },
              f.severity === 'critical' && styles.flagCritical,
              f.severity === 'high' && styles.flagHigh,
            ]}
          >
            <View style={[styles.flagIconWrap, variant === 'green' ? styles.flagIconGreen : styles.flagIconRed]}>
              <Text style={[styles.flagIcon, { color: t.mutedDark }]}>{variant === 'green' ? '▲' : '▼'}</Text>
            </View>
            <Text style={[styles.flagText, { color: t.ink }]}>{language === 'en' ? f.text_en : f.text_bn}</Text>
          </View>
        </AnimatedSection>
      ))}
    </View>
  );
}

export default function CreditScoreScreen() {
  const insets = useSafeAreaInsets();
  const { business, language } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [summary, setSummary] = useState<CreditScoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    setSummary(await repo.getCreditScoreSummary(business.id));
    setLoading(false);
    setRefreshing(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  if (!business) return null;

  if (loading || !summary) {
    return (
      <TabScreenShell withNav tabActive="more">
      <View style={styles.root}>
        <ScreenHeader title="ক্রেডিট স্কোর" backFallback="/(tabs)" />
        <ScreenLoader />
      </View>
      </TabScreenShell>
    );
  }

  const bandColor = bandColorToken(summary.band.color);
  const gradient = bandGradients[summary.band.color] ?? bandGradients.teal;
  const bandLabel = language === 'en' ? summary.band.label_en : summary.band.label_bn;
  const confLabel =
    language === 'en'
      ? confidenceLabelEn(summary.confidence)
      : confidenceLabelBn(summary.confidence);
  const deltaSentence =
    language === 'en' ? summary.delta.sentence_en : summary.delta.sentence_bn;
  const verdict =
    language === 'en'
      ? summary.recommendation.verdict_en
      : summary.recommendation.verdict_bn;
  const bindingNote =
    language === 'en'
      ? summary.recommendation.binding_note_en
      : summary.recommendation.binding_note_bn;

  return (
    <TabScreenShell withNav tabActive="more">
    <View style={styles.root}>
      <ScreenHeader title="ক্রেডিট স্কোর" backFallback="/(tabs)" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />
        }
      >
        <AnimatedSection index={0}>
          <LinearGradient
            colors={[gradient[0], gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <ScoreGauge
              score={summary.score}
              bandColor={summary.band.color}
              confidence={summary.confidence}
              size="hero"
              showMax
              onGradient
            />
            <Text style={styles.heroBand}>{bandLabel}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{confLabel}</Text>
              </View>
              <Text style={styles.percentile}>
                {language === 'en' ? 'Top' : 'উপরের'} {toBnDigits(summary.percentile)}%
              </Text>
            </View>
          </LinearGradient>
        </AnimatedSection>

        {summary.delta.value !== 0 ? (
          <AnimatedSection index={1}>
            <SurfaceCard>
              <Text style={[styles.sectionTitle, { color: t.ink }]}>
                {language === 'en' ? 'What changed' : 'কী বদলেছে'}
              </Text>
              <Text style={[styles.deltaSentence, { color: t.inkSecondary }]}>{deltaSentence}</Text>
              {summary.delta.drivers.map((d) => (
                <View key={d.message_key} style={styles.deltaRow}>
                  <Text
                    style={[
                      styles.deltaArrow,
                      { color: d.direction === 'up' ? t.receive : t.pay },
                    ]}
                  >
                    {d.direction === 'up' ? '▲' : '▼'}
                  </Text>
                  <Text style={[styles.deltaText, { color: t.ink }]}>
                    {language === 'en' ? d.text_en : d.text_bn}
                  </Text>
                </View>
              ))}
            </SurfaceCard>
          </AnimatedSection>
        ) : null}

        <AnimatedSection index={2}>
          <SurfaceCard>
            <Text style={[styles.sectionTitle, { color: t.ink }]}>
              {language === 'en' ? 'Strengths' : 'শক্তি'}
            </Text>
            <FlagList flags={summary.green_flags} variant="green" language={language} />
          </SurfaceCard>
        </AnimatedSection>

        <AnimatedSection index={3}>
          <SurfaceCard>
            <Text style={[styles.sectionTitle, { color: t.ink }]}>
              {language === 'en' ? 'Areas to improve' : 'উন্নতির সুযোগ'}
            </Text>
            <FlagList flags={summary.red_flags} variant="red" language={language} />
          </SurfaceCard>
        </AnimatedSection>

        <AnimatedSection index={4}>
          <InsightBanner
            badge="AI"
            title={language === 'en' ? 'Recommendation' : 'সুপারিশ'}
            body={verdict}
          />
          <SurfaceCard style={[styles.recCard, { borderColor: bandColor }]}>
            <View style={styles.recLimitRow}>
              <Text style={[styles.recLimitLabel, { color: t.mutedDark }]}>
                {language === 'en' ? 'Suggested limit' : 'প্রস্তাবিত সীমা'}
              </Text>
              <TakaAmount amount={summary.recommendation.limit_bdt} color={t.brand} />
            </View>
            {bindingNote ? <Text style={[styles.recNote, { color: t.muted }]}>{bindingNote}</Text> : null}
            {summary.recommendation.levers.length > 0 ? (
              <View style={styles.levers}>
                <Text style={[styles.leversTitle, { color: t.brand }]}>
                  {language === 'en' ? 'How to improve' : 'স্কোর বাড়ানোর উপায়'}
                </Text>
                {summary.recommendation.levers.map((l) => (
                  <View key={l.message_key} style={styles.leverRow}>
                    <Text style={styles.leverPts}>+{toBnDigits(l.points)}</Text>
                    <Text style={[styles.leverText, { color: t.ink }]}>
                      {language === 'en' ? l.text_en : l.text_bn}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </SurfaceCard>
        </AnimatedSection>

        <AnimatedSection index={5}>
          <Text style={[styles.disclaimer, { color: t.muted }]}>
            {language === 'en'
              ? 'Demo score data shown — will update when the live scoring service launches.'
              : 'প্রদর্শিত স্কোর ডেমো ডেটা — প্রকৃত স্কোরিং সার্ভিস চালু হলে আপডেট হবে।'}
          </Text>
        </AnimatedSection>
      </ScrollView>
    </View>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: {
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  heroBand: {
    ...typography.screenTitle,
    fontFamily: fonts.bengaliBold,
    color: colors.white,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption, color: colors.white, fontFamily: fonts.bengaliSemiBold },
  percentile: { ...typography.bodySm, color: 'rgba(255,255,255,0.9)' },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.sectionTitle },
  deltaSentence: { ...typography.bodySm, lineHeight: 22 },
  deltaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  deltaArrow: { fontSize: 14, lineHeight: 22 },
  deltaUp: { color: colors.receive },
  deltaDown: { color: colors.pay },
  deltaText: { ...typography.bodySm, flex: 1, lineHeight: 22 },
  flagList: { gap: spacing.sm },
  flagItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  flagIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagIconGreen: { backgroundColor: 'rgba(20,184,166,0.2)' },
  flagIconRed: { backgroundColor: 'rgba(251,113,133,0.2)' },
  flagCritical: { borderLeftWidth: 3, borderLeftColor: colors.pay },
  flagHigh: { borderLeftWidth: 3, borderLeftColor: colors.amber },
  flagIcon: { fontSize: 11, lineHeight: 16 },
  flagText: { ...typography.bodySm, flex: 1, lineHeight: 22 },
  recCard: {
    borderRadius: radius.xl,
    borderWidth: 2,
    gap: spacing.sm,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  recTitle: { ...typography.label, marginTop: spacing.xs },
  recVerdict: { ...typography.sectionTitle },
  recLimitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  recLimitLabel: { ...typography.bodySm },
  recNote: { ...typography.caption, lineHeight: 20 },
  levers: { marginTop: spacing.sm, gap: spacing.sm },
  leversTitle: { ...typography.label },
  leverRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  leverPts: {
    fontFamily: fonts.numeral,
    fontSize: 16,
    color: colors.receive,
    minWidth: 36,
  },
  leverText: { ...typography.bodySm, flex: 1, lineHeight: 22 },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});
