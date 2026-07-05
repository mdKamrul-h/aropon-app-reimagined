import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { AroponLogo } from '@/components/brand/AroponLogo';
import { verifyOtp, sendOtp, fetchProfileUsername } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
import { devBypassSignIn, getDevTestOtp, isDevBypassOtpEnabled } from '@/lib/devAuth';
import { goBackOr } from '@/lib/navigation';
import { formatBnPhone, formatBnTimer, toBnDigits } from '@/utils/bn-numerals';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { colors, spacing, typography } from '@/constants/theme';

function resolvePhoneParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function OtpScreen() {
  const params = useLocalSearchParams<{ phone?: string | string[] }>();
  const phone = resolvePhoneParam(params.phone);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const [digits, setDigits] = useState('');
  const [timer, setTimer] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef('');

  useEffect(() => {
    if (digits.length < 6) submittedRef.current = '';
  }, [digits]);

  useEffect(() => {
    if (!phone) router.replace('/(auth)/phone');
  }, [phone, router]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const onKey = (key: string) => {
    if (key === 'back') {
      setDigits((d) => d.slice(0, -1));
      setError('');
      return;
    }
    if (digits.length < 6) {
      setDigits((d) => d + key);
      setError('');
    }
  };

  const verify = async (code: string) => {
    if (code.length < 6) {
      setError('৬ সংখ্যার OTP দিন');
      return;
    }
    if (!phone) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await verifyOtp(phone, code);
    setLoading(false);
    if (err) {
      setError(authErrorMessage(err.message));
      return;
    }
    const userId = data.user?.id;
    if (userId) {
      try {
        const existingUsername = await fetchProfileUsername(userId);
        if (existingUsername) {
          router.replace('/');
          return;
        }
      } catch {
        // Continue to set-credentials if profile lookup fails
      }
    }
    router.replace('/(auth)/set-credentials');
  };

  useEffect(() => {
    if (digits.length !== 6 || digits === submittedRef.current || loading) return;
    submittedRef.current = digits;
    void verify(digits);
  }, [digits, loading]);

  const devBypass = isDevBypassOtpEnabled();

  const devSkip = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await devBypassSignIn(phone);
    setLoading(false);
    if (err) {
      setError(authErrorMessage(err.message));
      return;
    }
    router.replace('/(auth)/set-credentials');
  };

  const resend = async () => {
    if (timer > 0 || !phone) return;
    setError('');
    const { error: err } = await sendOtp(phone);
    if (err) {
      setError(authErrorMessage(err.message));
      return;
    }
    setDigits('');
    setTimer(45);
  };

  const boxes = Array.from({ length: 6 }, (_, i) => digits[i] ?? '');

  if (!phone) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: t.surface }]}>
      <LinearGradient
        colors={[...t.headerGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Pressable
          onPress={() => goBackOr({ pathname: '/(auth)/phone', params: phone ? { phone } : undefined })}
          style={styles.backBtn}
        >
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <AroponLogo size={52} />
          <View>
            <Text style={styles.headerTitle}>যাচাই করুন</Text>
            <Text style={styles.headerSub}>
              {formatBnPhone(phone)} নম্বরে কোড পাঠানো হয়েছে
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* OTP body */}
      <View style={styles.body}>
        <View style={styles.otpRow}>
          {boxes.map((v, i) => (
            <View key={i} style={[styles.box, i === digits.length && styles.boxActive]}>
              <Text style={styles.boxText}>{toBnDigits(v)}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={resend} disabled={timer > 0}>
          <Text style={[styles.resend, timer > 0 && styles.resendMuted]}>
            {timer > 0 ? `পুনরায় পাঠান ${formatBnTimer(timer)}` : 'পুনরায় OTP পাঠান'}
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {devBypass ? (
          <Pressable onPress={devSkip} disabled={loading} style={styles.devSkip}>
            <Text style={styles.devSkipText}>Dev: OTP ছাড়াই ঢুকুন ({getDevTestOtp()})</Text>
          </Pressable>
        ) : null}

        <Button
          label="যাচাই করুন"
          onPress={() => verify(digits)}
          loading={loading}
          disabled={digits.length < 6}
          style={styles.verifyBtn}
        />
        <NumericKeypad onKey={onKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  // Header
  header: { paddingHorizontal: spacing.xl, paddingBottom: 28, gap: 16 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  back: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: 'rgba(255,255,255,0.9)' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { fontFamily: 'HindSiliguri_700Bold', fontSize: 22, color: colors.white, letterSpacing: -0.3 },
  headerSub: { fontFamily: 'HindSiliguri_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  // Body
  body: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  otpRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.lg },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  boxActive: { borderColor: colors.brand, shadowColor: colors.brand, shadowOpacity: 0.2 },
  boxText: { ...typography.numeralLg, color: colors.ink },
  resend: { ...typography.bodySm, color: colors.brand, textAlign: 'center', marginBottom: spacing.md, fontWeight: '700' },
  resendMuted: { color: colors.mutedDark, fontWeight: '500' },
  error: { ...typography.caption, color: colors.pay, textAlign: 'center', marginBottom: spacing.sm },
  devSkip: { marginBottom: spacing.sm, alignItems: 'center' },
  devSkipText: { ...typography.bodySm, color: colors.mutedDark, textDecorationLine: 'underline' },
  verifyBtn: { marginVertical: spacing.md },
});
