import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { getMeta } from '@/lib/db/database';
import { spacing, typography } from '@/constants/theme';

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const { business } = useAuth();
  const { repo, refreshSync, syncState } = useRepository();
  const { showSuccess, showError } = useToast();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const ts = await getMeta('last_sync_at').catch(() => null);
    setLastSync(ts);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const syncNow = async () => {
    setSyncing(true);
    try {
      await refreshSync();
      await load();
      showSuccess('সিঙ্ক সম্পন্ন');
    } catch {
      showError('সিঙ্ক ব্যর্থ');
    }
    setSyncing(false);
  };

  const exportData = async () => {
    if (!business) return;
    const [parties, products, txns] = await Promise.all([
      repo.getParties(business.id),
      repo.getProducts(business.id),
      repo.getTransactions(business.id),
    ]);
    const payload = JSON.stringify({ business, parties, products, transactions: txns }, null, 2);
    await Share.share({ message: payload, title: 'আরোপন ব্যাকআপ' });
  };

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader title="ব্যাকআপ ও রিস্টোর" backFallback={'/settings' as never} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={[styles.meta, { color: t.inkSecondary }]}>স্ট্যাটাস: {syncState}</Text>
        {lastSync ? <Text style={[styles.meta, { color: t.inkSecondary }]}>শেষ সিঙ্ক: {lastSync}</Text> : null}
        <Button label="এখনই সিঙ্ক করুন" onPress={syncNow} loading={syncing} />
        <Button label="ডেটা এক্সপোর্ট করুন" variant="outline" onPress={exportData} />
        <Text style={[styles.hint, { color: t.muted }]}>এক্সপোর্ট করা JSON ফাইল নিরাপদ জায়গায় রাখুন।</Text>
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  meta: { ...typography.bodySm },
  hint: { ...typography.caption, textAlign: 'center' },
});
