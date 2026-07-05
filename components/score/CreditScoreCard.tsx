import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { ScoreGauge } from '@/components/score/ScoreGauge';
import type { CreditScoreSummary } from '@/types/creditScore';
import { confidenceLabelBn, bandColorOnDark } from '@/lib/scoring/bandColors';
import { bandGradients } from '@/constants/theme';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { toBnDigits } from '@/utils/bn-numerals';
import { useUiPreferences } from '@/context/UiPreferencesContext';

interface CreditScoreCardProps {
  summary: CreditScoreSummary;
  index?: number;
}

export function CreditScoreCard({ summary, index = 1 }: CreditScoreCardProps) {
  const router = useRouter();
  const { resolvedTheme: t } = useUiPreferences();
  const isPreliminary = summary.confidence === 'preliminary';
  const gradient = bandGradients[summary.band.color] ?? bandGradients.green;
  const bandTextColor = t.isDark ? bandColorOnDark(summary.band.color) : gradient[0];

  return (
    <AnimatedSection index={index}>
      <AnimatedPressable
        variant="tile"
        haptic="light"
        onPress={() => router.push('/credit-score')}
        style={styles.pressable}
      >
        <LinearGradient
          colors={[`${gradient[0]}18`, `${gradient[1]}08`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderColor: bandTextColor, backgroundColor: t.card }]}
        >
          <View style={styles.left}>
            <ScoreGauge
              score={summary.score}
              bandColor={summary.band.color}
              confidence={summary.confidence}
              size="compact"
            />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: t.mutedDark }]}>ক্রেডিট স্কোর</Text>
            <Text style={[styles.band, { color: bandTextColor }]}>{summary.band.label_bn}</Text>
            <Text style={[styles.percentile, { color: t.muted }]}>
              জাতীয়ভাবে উপরের {toBnDigits(summary.percentile)}%
            </Text>
            {isPreliminary ? (
              <Text style={styles.preliminary}>প্রাথমিক স্কোর — কিস্তি দিলে স্পষ্ট হবে</Text>
            ) : (
              <Text style={[styles.confidence, { color: bandTextColor }]}>
                {confidenceLabelBn(summary.confidence)}
              </Text>
            )}
          </View>
          <Text style={[styles.chevron, { color: t.muted }]}>›</Text>
        </LinearGradient>
      </AnimatedPressable>
    </AnimatedSection>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 2,
    padding: spacing.lg,
    gap: spacing.md,
  },
  left: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { ...typography.label },
  band: { ...typography.sectionTitle, fontFamily: fonts.bengaliSemiBold },
  percentile: { ...typography.caption },
  preliminary: { ...typography.caption, color: colors.amber, marginTop: 2 },
  confidence: { ...typography.caption, marginTop: 2 },
  chevron: { fontSize: 28 },
});
