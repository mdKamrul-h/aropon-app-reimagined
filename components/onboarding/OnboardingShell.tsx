import { useEffect, useRef, type ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { radius, spacing, typography } from '@/constants/theme';

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  footer,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const pop = useRef(new Animated.Value(0.92)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0.92);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(pop, {
        toValue: 1,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, pop, fade]);

  return (
    <AppScreenShell variant="auth">
      <View style={[styles.root, { backgroundColor: t.surface, paddingTop: insets.top }]}>
        <LinearGradient
          colors={[...t.headerGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>দোকান সেটআপ</Text>
          <View style={styles.progress}>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <View
                key={s}
                style={[styles.progressSeg, step >= s && styles.progressSegActive]}
              />
            ))}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fade, transform: [{ scale: pop }] }}>
            <Text style={[styles.stepHint, { color: t.muted }]}>ধাপ {step} / {totalSteps}</Text>
            <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: t.muted }]}>{subtitle}</Text> : null}
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 12, backgroundColor: t.card, borderTopColor: t.border },
          ]}
        >
          {footer}
        </View>
      </View>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { ...typography.screenTitle, color: '#fff' },
  progress: { flexDirection: 'row', gap: spacing.xs },
  progressSeg: {
    width: 32,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  progressSegActive: { backgroundColor: '#fff' },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  stepHint: { ...typography.caption, marginBottom: spacing.xs },
  title: { ...typography.sectionTitle, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, marginBottom: spacing.md },
  body: { marginTop: spacing.md, gap: spacing.lg },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
