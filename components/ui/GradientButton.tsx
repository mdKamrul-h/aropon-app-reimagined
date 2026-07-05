import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, typography } from '@/constants/theme';

interface GradientButtonProps {
  label: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

export function GradientButton({
  label,
  onPress,
  disabled,
  loading,
  compact = false,
  style,
}: GradientButtonProps) {
  const { preferences, resolvedTheme: t } = useUiPreferences();
  const [confetti, setConfetti] = useState(false);

  const handlePress = async () => {
    if (!onPress) return;
    await onPress();
    if (preferences.confettiOnCta) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1200);
    }
  };

  return (
    <View style={style}>
      <AnimatedPressable
        onPress={() => void handlePress()}
        disabled={disabled || loading}
        haptic="light"
        scaleTo={t.bounceScale}
        style={[styles.wrap, { borderRadius: t.radiusLg }, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={[...t.ctaGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { borderRadius: t.radiusLg },
            compact && styles.gradientCompact,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </LinearGradient>
      </AnimatedPressable>
      {confetti ? <ConfettiBurst /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  gradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  gradientCompact: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  label: {
    ...typography.body,
    fontFamily: fonts.bengaliSemiBold,
    color: '#fff',
  },
  disabled: { opacity: 0.5 },
});
