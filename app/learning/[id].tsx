import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { LearningItem } from '@/types/schema';
import { fonts, radius, spacing, typography } from '@/constants/theme';

export default function LearningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [item, setItem] = useState<LearningItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const items = await repo.getLearningItems();
    setItem(items.find((i) => i.id === String(id)) ?? null);
    setLoading(false);
  }, [id, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <TabScreenShell withNav tabActive="more">
        <ScreenHeader title="ব্যবসা শিক্ষা" backFallback="/learning" />
        <ScreenLoader />
      </TabScreenShell>
    );
  }

  if (!item) {
    return (
      <TabScreenShell withNav tabActive="more">
        <ScreenHeader title="ব্যবসা শিক্ষা" backFallback="/learning" />
        <Text style={[styles.missing, { color: t.muted }]}>নিবন্ধ পাওয়া যায়নি</Text>
      </TabScreenShell>
    );
  }

  const title = language === 'en' ? item.title_en : item.title_bn;
  const body =
    (language === 'en' ? item.body_en : item.body_bn) ?? item.summary_bn;

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader title={title} backFallback="/learning" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={[styles.chip, { backgroundColor: `${t.brand}25` }]}>
          <Text style={[styles.chipText, { color: t.brand }]}>{item.category}</Text>
        </View>
        <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
        <Text style={[styles.body, { color: t.inkSecondary }]}>{body}</Text>
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption },
  title: { ...typography.screenTitle },
  body: { ...typography.body, lineHeight: 26 },
  missing: { ...typography.body, textAlign: 'center', padding: spacing.xl },
});
