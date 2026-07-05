import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ScoreGauge } from '@/components/score/ScoreGauge';
import type { CreditScoreSummary } from '@/types/creditScore';
import { bandGradients, colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { toBnDigits } from '@/utils/bn-numerals';

interface CreditScoreFeaturedCardProps {
  summary: CreditScoreSummary;
}

export function CreditScoreFeaturedCard({ summary }: CreditScoreFeaturedCardProps) {
  const router = useRouter();
  const gradient = bandGradients[summary.band.color] ?? bandGradients.teal;

  return (
    <AnimatedPressable
      variant="tile"
      haptic="light"
      onPress={() => router.push('/credit-score')}
      style={styles.pressable}
    >
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.gaugeWrap}>
          <ScoreGauge
            score={summary.score}
            bandColor={summary.band.color}
            confidence={summary.confidence}
            size="compact"
            onGradient
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>ক্রেডিট স্কোর</Text>
          <Text style={styles.band}>{summary.band.label_bn}</Text>
          <Text style={styles.hint}>উপরের {toBnDigits(summary.percentile)}% ব্যবসায়ী</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{toBnDigits(summary.score)}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  gaugeWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    padding: 4,
  },
  body: { flex: 1, gap: 2 },
  label: { ...typography.caption, color: 'rgba(255,255,255,0.9)' },
  band: { ...typography.sectionTitle, color: colors.white, fontFamily: fonts.bengaliBold },
  hint: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.numeral,
    fontSize: 16,
    color: colors.white,
  },
  chevron: { fontSize: 24, color: 'rgba(255,255,255,0.7)' },
});
