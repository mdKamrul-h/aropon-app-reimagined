import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usernameToAuthEmail } from '@/lib/authCredentials';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!username.trim()) {
      setError('ইউজারনেম দিন');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(usernameToAuthEmail(username));
    setLoading(false);
    if (err) {
      setError('রিসেট লিংক পাঠানো যায়নি। সাপোর্টে যোগাযোগ করুন।');
      return;
    }
    setSent(true);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>পাসওয়ার্ড ভুলে গেছেন?</Text>
      <Text style={styles.sub}>ইউজারনেম দিন। রিসেট লিংক ইমেইলে পাঠানো হবে (অভ্যন্তরীণ অ্যাকাউন্ট)।</Text>
      {sent ? (
        <Text style={styles.success}>অনুরোধ পাঠানো হয়েছে। ইমেইল চেক করুন বা সাপোর্টে যোগাযোগ করুন।</Text>
      ) : (
        <>
          <Input label="ইউজারনেম" value={username} onChangeText={setUsername} autoCapitalize="none" error={error} />
          <Button label="রিসেট লিংক পাঠান" onPress={submit} loading={loading} />
        </>
      )}
      <Button label="লগইনে ফিরুন" variant="outline" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.xxl, gap: spacing.md },
  title: { ...typography.screenTitle, color: colors.ink },
  sub: { ...typography.body, color: colors.mutedDark, marginBottom: spacing.md },
  success: { ...typography.body, color: colors.receive },
});
