import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AroponLogo } from '@/components/brand/AroponLogo';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { FadeInSection } from '@/components/ui/FadeInSection';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { radius, spacing, typography } from '@/constants/theme';

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  stepBadge?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScreenShell({
  title,
  subtitle,
  onBack,
  stepBadge,
  children,
  footer,
}: AuthScreenShellProps) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <AppScreenShell variant="auth">
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: t.surface }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={[t.mood.accent, t.brand, t.mood.primary2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          {onBack ? (
            <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <View style={styles.headerCenter}>
            <View style={styles.logoWrap}>
              <AroponLogo size={52} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>{title}</Text>
                {stepBadge ? (
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{stepBadge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.headerSub}>{subtitle}</Text>
            </View>
          </View>
          <View style={[styles.goldAccent, { backgroundColor: t.brandGold }]} />
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <FadeInSection>
            <View style={[styles.formCard, { backgroundColor: t.card, borderColor: t.border }]}>{children}</View>
          </FadeInSection>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreenShell>
  );
}

export function AuthDivider() {
  const { resolvedTheme: t } = useUiPreferences();
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
      <Text style={[styles.dividerText, { color: t.muted }]}>অথবা</Text>
      <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
    </View>
  );
}

export function AuthAltCard({ label, onPress }: { label: string; onPress: () => void }) {
  const { resolvedTheme: t } = useUiPreferences();
  return (
    <AnimatedPressable
      style={[styles.altCard, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      haptic="light"
    >
      <Text style={[styles.altLabel, { color: t.ink }]}>{label}</Text>
      <Text style={[styles.altArrow, { color: t.brand }]}>→</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 24,
    gap: 12,
  },
  goldAccent: { height: 3, borderRadius: 2, marginTop: 4 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: 'rgba(255,255,255,0.92)' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoWrap: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 6,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  headerTitle: { ...typography.screenTitle, color: '#fff' },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  stepBadgeText: {
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  headerSub: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  scroll: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.lg },
  formCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Outfit_400Regular', fontSize: 14 },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
  },
  altLabel: { ...typography.label },
  altArrow: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
});
