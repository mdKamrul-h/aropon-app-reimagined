import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthAltCard, AuthDivider, AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sendOtp } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
import { devBypassSignIn, isDevBypassOtpEnabled } from '@/lib/devAuth';
import { goBackOr } from '@/lib/navigation';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing } from '@/constants/theme';

export default function PhoneScreen() {
  const router = useRouter();
  const { resolvedTheme: t } = useUiPreferences();
  const [phone, setPhone] = useState('01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const devBypass = isDevBypassOtpEnabled();

  const devSkip = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await devBypassSignIn(phone);
    setLoading(false);
    if (err) {
      setError(authErrorMessage(err.message) + ' (Dashboard → Auth → Phone → Test numbers এ নম্বর + OTP যোগ করুন)');
      return;
    }
    router.replace('/(auth)/set-credentials');
  };

  const submit = async () => {
    if (phone.replace(/\D/g, '').length < 11) { setError('সঠিক মোবাইল নম্বর দিন'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await sendOtp(phone);
    setLoading(false);
    if (err) { setError(authErrorMessage(err.message)); return; }
    router.push({ pathname: '/(auth)/otp', params: { phone } });
  };

  return (
    <AuthScreenShell
      title="নিবন্ধন"
      subtitle="নতুন দোকান হিসাব তৈরি করুন"
      stepBadge="১"
      onBack={() => goBackOr('/(auth)/login')}
      footer={
        <>
          {devBypass ? (
            <Pressable onPress={devSkip} disabled={loading} style={styles.devSkip}>
              <Text style={[styles.devSkipText, { color: t.muted }]}>Dev: OTP ছাড়াই ঢুকুন →</Text>
            </Pressable>
          ) : null}
          <AuthDivider />
          <AuthAltCard label="লগইন করুন" onPress={() => router.replace('/(auth)/login')} />
        </>
      }
    >
      <Text style={[styles.stepLabel, { color: t.ink }]}>মোবাইল নম্বর দিন</Text>
      <Text style={[styles.stepDesc, { color: t.muted }]}>আপনার ফোনে একটি OTP কোড পাঠানো হবে</Text>
      <Input
        label="ফোন নম্বর"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="01XXXXXXXXX"
        error={error}
      />
      <Button label="OTP পাঠান →" onPress={submit} loading={loading} />
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  stepLabel: {
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 16,
  },
  stepDesc: {
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 13,
    marginBottom: 4,
  },
  devSkip: { alignItems: 'center', paddingVertical: spacing.xs },
  devSkipText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
