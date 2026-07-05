import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { bandColorOnDark } from '@/lib/scoring/bandColors';
import type { CreditScoreBandColor, CreditScoreConfidence } from '@/types/creditScore';
import { colors, fonts } from '@/constants/theme';
import { toBnDigits } from '@/utils/bn-numerals';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MAX_SCORE = 1000;

interface ScoreGaugeProps {
  score: number;
  bandColor: CreditScoreBandColor;
  confidence?: CreditScoreConfidence;
  size?: 'compact' | 'hero';
  showMax?: boolean;
  /** Force light score/track colors (e.g. on gradient hero) */
  onGradient?: boolean;
}

export function ScoreGauge({
  score,
  bandColor,
  confidence = 'verified',
  size = 'compact',
  showMax = false,
  onGradient = false,
}: ScoreGaugeProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const dims = size === 'hero' ? { box: 140, stroke: 8, fontSize: 42 } : { box: 72, stroke: 5, fontSize: 28 };
  const radius = (dims.box - dims.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeColor = onGradient
    ? colors.white
    : t.isDark
      ? bandColorOnDark(bandColor)
      : t.brandDark;

  const trackColor = onGradient
    ? 'rgba(255,255,255,0.35)'
    : t.isDark
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(8,51,68,0.15)';

  const scoreTextColor = onGradient ? colors.white : t.isDark ? bandColorOnDark(bandColor) : t.ink;
  const maxTextColor = onGradient ? 'rgba(255,255,255,0.8)' : t.muted;

  const isPreliminary = confidence === 'preliminary';

  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    progress.value = withTiming(score / MAX_SCORE, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    const start = Date.now();
    const duration = 900;
    const from = 0;
    const tick = () => {
      const elapsed = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - elapsed) ** 3;
      setDisplayScore(Math.round(from + (score - from) * eased));
      if (elapsed < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const center = dims.box / 2;

  return (
    <View style={[styles.wrap, { width: dims.box, height: dims.box }]}>
      <Svg width={dims.box} height={dims.box} style={styles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={dims.stroke}
          fill="none"
          strokeDasharray={isPreliminary ? '6 4' : undefined}
          opacity={onGradient ? 1 : 0.6}
        />
        <G transform={`rotate(-90, ${center}, ${center})`}>
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={dims.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <View style={styles.center}>
        <Text
          style={[
            styles.score,
            { fontSize: dims.fontSize, lineHeight: dims.fontSize + 6, color: scoreTextColor },
          ]}
        >
          {toBnDigits(displayScore)}
        </Text>
        {showMax ? (
          <Text style={[styles.max, { color: maxTextColor }]}>/ {toBnDigits(MAX_SCORE)}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.numeral },
  max: { fontSize: 11, marginTop: -2 },
});
