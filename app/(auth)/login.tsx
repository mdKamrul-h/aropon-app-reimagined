import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthAltCard, AuthDivider, AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authErrorMessage } from '@/lib/authErrors';
import { goBackOr } from '@/lib/navigation';
import { signInWithUsername } from '@/lib/supabase';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing } from '@/constants/theme';

const DEMO_USERNAME = process.env.EXPO_PUBLIC_DEMO_USERNAME ?? '';
const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? 'demo1234';

export default function LoginScreen() {
  const router = useRouter();
  const { resolvedTheme: t } = useUiPreferences();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!username.trim()) { setError('ইউজারনেম দিন'); return; }
    if (!password) { setError('পাসওয়ার্ড দিন'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await signInWithUsername(username, password);
    setLoading(false);
    if (err) { setError(authErrorMessage(err.message)); return; }
    router.replace('/');
  };

  return (
    <AuthScreenShell
      title="লগইন"
      subtitle="আপনার দোকানের হিসাবে ফিরে আসুন"
      onBack={() => goBackOr('/(auth)/language')}
      footer={
        <>
          <AuthDivider />
          <AuthAltCard
            label="নতুন অ্যাকাউন্ট তৈরি করুন"
            onPress={() => router.push('/(auth)/phone')}
          />
        </>
      }
    >
      <Input
        label="ইউজারনেম"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="dokan123"
      />
      <Input
        label="পাসওয়ার্ড"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        error={error}
      />

      <Button label="লগইন →" onPress={submit} loading={loading} style={styles.submit} />
      {__DEV__ && DEMO_USERNAME ? (
        <Pressable
          style={[
            styles.demoChip,
            { borderRadius: t.radiusMd, backgroundColor: `${t.brand}12`, borderColor: `${t.brand}30` },
          ]}
          onPress={() => {
            setUsername(DEMO_USERNAME);
            setPassword(DEMO_PASSWORD);
            setError('');
          }}
        >
          <Text style={[styles.demoChipText, { color: t.brand }]}>
            ডেমো: {DEMO_USERNAME} / {DEMO_PASSWORD}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={[styles.forgot, { color: t.brand }]}>পাসওয়ার্ড ভুলে গেছেন?</Text>
      </Pressable>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 4 },
  demoChip: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  demoChipText: {
    fontFamily: 'HindSiliguri_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  forgot: { fontFamily: 'HindSiliguri_500Medium', fontSize: 14, textAlign: 'center', marginTop: spacing.sm },
});
