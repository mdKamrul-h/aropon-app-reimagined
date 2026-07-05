import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { filterLearningArticles } from '@/constants/learningArticles';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import type { LearningItem } from '@/types/schema';
import { fonts, radius, spacing, typography } from '@/constants/theme';

export default function LearningScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { business, language } = useAuth();
  const { repo } = useRepository();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await repo.getLearningItems());
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const filtered = business
      ? filterLearningArticles(items, business.business_type)
      : items;
    return filtered.filter((i) => !dismissed.has(i.id));
  }, [business, dismissed, items]);

  const { resolvedTheme: t } = useUiPreferences();

  return (
    <TabScreenShell withNav tabActive="more">
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title="ব্যবসা শিক্ষা" backFallback="/(tabs)/more" />
      {loading ? (
        <ScreenLoader />
      ) : visible.length === 0 ? (
        <EmptyState icon="book" title="শীঘ্রই নতুন টিপস আসছে" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {visible.map((item) => {
            const title = language === 'en' ? item.title_en : item.title_bn;
            const summary = language === 'en' ? item.summary_en : item.summary_bn;
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/learning/[id]', params: { id: item.id } })}
              >
                <SurfaceCard style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.chip, { backgroundColor: `${t.brand}25` }]}>
                    <Text style={[styles.chipText, { color: t.brand }]}>{item.category}</Text>
                  </View>
                  {item.is_new ? (
                    <View style={[styles.newBadge, { backgroundColor: t.amberTintBorder }]}>
                      <Text style={styles.newText}>নতুন</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
                <Text style={[styles.body, { color: t.mutedDark }]}>{summary}</Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.readMore, { color: t.brand }]}>পড়ুন ›</Text>
                  <Pressable onPress={() => setDismissed((s) => new Set(s).add(item.id))}>
                    <Text style={[styles.dismiss, { color: t.muted }]}>পড়েছি</Text>
                  </Pressable>
                </View>
                </SurfaceCard>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.caption },
  newBadge: { paddingHorizontal: spacing.sm, borderRadius: radius.pill },
  newText: { ...typography.caption, color: '#fff' },
  title: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  body: { ...typography.bodySm, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  readMore: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },
  dismiss: { ...typography.caption },
});
