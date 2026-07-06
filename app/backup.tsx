import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { getMeta } from '@/lib/db/database';
import { spacing, typography } from '@/constants/theme';

const SYNC_LABEL: Record<string, string> = {
  online: 'সিঙ্ক ঠিক আছে',
  pending: 'সিঙ্ক বাকি আছে',
  offline: 'ইন্টারনেট নেই',
};

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const { business } = useAuth();
  const { repo, refreshSync, syncState } = useRepository();
  const { showSuccess, showError } = useToast();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreText, setRestoreText] = useState('');

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
    setExporting(true);
    try {
      const payload = await repo.exportBackup(business.id);
      await Share.share({ message: JSON.stringify(payload, null, 2), title: 'আরোপন ব্যাকআপ' });
    } catch {
      showError('এক্সপোর্ট ব্যর্থ');
    }
    setExporting(false);
  };

  const restoreData = async () => {
    if (!business || !restoreText.trim()) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(restoreText);
    } catch {
      showError('এটি সঠিক ব্যাকআপ ফাইলের লেখা নয়');
      return;
    }
    Alert.alert(
      'ব্যাকআপ রিস্টোর করবেন?',
      'ব্যাকআপের ডেটা বর্তমান ডেটার সাথে মিলিয়ে (merge) সংরক্ষণ করা হবে। একই আইডির ডেটা ব্যাকআপ দিয়ে প্রতিস্থাপিত হবে।',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'রিস্টোর করুন',
          onPress: async () => {
            setRestoring(true);
            try {
              const result = await repo.restoreBackup(business.id, parsed);
              showSuccess(`রিস্টোর সম্পন্ন — ${result.tables}টি টেবিল, ${result.rows}টি সারি`);
              setRestoreText('');
            } catch {
              showError('রিস্টোর ব্যর্থ');
            }
            setRestoring(false);
          },
        },
      ],
    );
  };

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader title="ব্যাকআপ ও রিস্টোর" backFallback={'/settings' as never} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <SurfaceCard style={styles.section}>
          <SectionHeader icon="backup" title="সিঙ্ক ও এক্সপোর্ট" />
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    syncState === 'online' ? t.syncOnline : syncState === 'pending' ? t.syncPending : t.syncOffline,
                },
              ]}
            />
            <Text style={[styles.meta, { color: t.inkSecondary }]}>{SYNC_LABEL[syncState] ?? syncState}</Text>
          </View>
          {lastSync ? <Text style={[styles.meta, { color: t.muted }]}>শেষ সিঙ্ক: {lastSync}</Text> : null}
          <Button label="এখনই সিঙ্ক করুন" onPress={syncNow} loading={syncing} />
          <Button label="ডেটা এক্সপোর্ট করুন" variant="outline" onPress={exportData} loading={exporting} />
          <Text style={[styles.hint, { color: t.muted }]}>
            এক্সপোর্টে আপনার সব দোকান, পার্টি, পণ্য, লেনদেন, ঋণ ও ক্রেডিট স্কোরের তথ্য থাকে। ফাইলটি নিরাপদ জায়গায় রাখুন।
          </Text>
        </SurfaceCard>

        <SurfaceCard style={styles.section}>
          <SectionHeader icon="orders" title="রিস্টোর করুন" />
          <Text style={[styles.hint, { color: t.muted }]}>
            আগে এক্সপোর্ট করা ব্যাকআপ টেক্সট এখানে পেস্ট করুন।
          </Text>
          <Input
            value={restoreText}
            onChangeText={setRestoreText}
            multiline
            numberOfLines={6}
            style={styles.restoreInput}
            placeholder="এখানে পেস্ট করুন..."
          />
          <Button
            label="রিস্টোর করুন"
            variant="outline"
            onPress={restoreData}
            loading={restoring}
            disabled={!restoreText.trim()}
          />
        </SurfaceCard>
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  section: { gap: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  meta: { ...typography.bodySm },
  hint: { ...typography.caption },
  restoreInput: { minHeight: 120, textAlignVertical: 'top' },
});
