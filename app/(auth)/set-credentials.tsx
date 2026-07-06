import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/lib/authErrors';
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '@/lib/authCredentials';
import { completeRegistrationCredentials, isUsernameAvailable, supabase } from '@/lib/supabase';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

export default function SetCredentialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const { session, language, setProfile } = useAuth();
  const { repo } = useRepository();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!session?.user) return;

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const available = await isUsernameAvailable(username);
      if (!available) {
        setError('এই ইউজারনেম ইতিমধ্যে নেওয়া হয়েছে');
        setLoading(false);
        return;
      }

      const { error: authErr } = await completeRegistrationCredentials(username, password);
      if (authErr) {
        setError(authErrorMessage(authErr.message));
        setLoading(false);
        return;
      }

      const normalized = normalizeUsername(username);
      const profile = await repo.upsertProfile({
        user_id: session.user.id,
        language,
        phone: session.user.phone ?? null,
        username: normalized,
      });
      setProfile(profile);

      await supabase.from('profiles').upsert(
        {
          user_id: session.user.id,
          language,
          phone: session.user.phone ?? null,
          username: normalized,
        },
        { onConflict: 'user_id' },
      );

      setLoading(false);
      router.replace('/(auth)/business-setup');
    } catch (e) {
      setLoading(false);
      setError(authErrorMessage(e instanceof Error ? e.message : 'কিছু ভুল হয়েছে'));
    }
  };

  if (!session?.user) {
    return <Redirect href="/(auth)/phone" />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.card, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.step, { color: t.brand }]}>ধাপ ২/৩</Text>
        <Text style={[styles.title, { color: t.ink }]}>অ্যাকাউন্ট তৈরি</Text>
        <Text style={[styles.sub, { color: t.mutedDark }]}>লগইনের জন্য ইউজারনেম ও পাসওয়ার্ড সেট করুন</Text>

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
          placeholder="কমপক্ষে ৬ অক্ষর"
        />
        <Input
          label="পাসওয়ার্ড নিশ্চিত করুন"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="আবার পাসওয়ার্ড দিন"
          error={error}
        />

        <Button label="সংরক্ষণ →" onPress={submit} loading={loading} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xxl, gap: spacing.md },
  step: { ...typography.caption, fontWeight: '700' },
  title: { ...typography.screenTitle },
  sub: { ...typography.body, marginBottom: spacing.md },
  submit: { marginTop: spacing.sm },
});
