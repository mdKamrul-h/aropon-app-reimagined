import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppCard } from '@/components/layout/AppCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { ListCard } from '@/components/layout/ListCard';
import { SectionBlock } from '@/components/layout/SectionBlock';
import { CreditScoreFeaturedCard } from '@/components/score/CreditScoreFeaturedCard';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { ListRow } from '@/components/ui/ListRow';
import { TierBadge } from '@/components/ui/TierBadge';
import { filterLearningArticles } from '@/constants/learningArticles';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { CreditScoreSummary } from '@/types/creditScore';
import { toBnDigits } from '@/utils/bn-numerals';
import { fonts, spacing, typography } from '@/constants/theme';

export default function MoreScreen() {
  const router = useRouter();
  const { business, logout } = useAuth();
  const { repo } = useRepository();
  const [activeLoanCount, setActiveLoanCount] = useState(0);
  const [learningPreview, setLearningPreview] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScoreSummary | null>(null);
  const { resolvedTheme: t } = useUiPreferences();

  const load = useCallback(async () => {
    if (!business) return;
    const [loans, learning, score] = await Promise.all([
      repo.getLoans(business.id, 'active'),
      repo.getLearningItems(),
      repo.getCreditScoreSummary(business.id),
    ]);
    setActiveLoanCount(loans.length);
    setCreditScore(score);
    const filtered = filterLearningArticles(learning, business.business_type);
    setLearningPreview(filtered.slice(0, 3).map((a) => a.title_bn));
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!business) return null;

  return (
    <AppScreenShell variant="tabRoot">
      <AppHeader variant="tabRoot" shopName={business.name} shopMeta={business.owner_name} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: 100 }}>
        <TierBadge />
        <AnimatedSection index={0}>
          <AppCard style={styles.section}>
            <SectionBlock title="ক্রেডিট স্কোর" meta="আপনার ব্যবসার স্কোর" />
            {creditScore ? <CreditScoreFeaturedCard summary={creditScore} /> : null}
          </AppCard>
        </AnimatedSection>

        <AnimatedSection index={1}>
          <ListCard>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: t.muted }]}>অ্যাকাউন্ট</Text>
            </View>
            <ListRow
              icon="profit"
              label="লোন ও কিস্তি"
              badge={activeLoanCount > 0 ? toBnDigits(activeLoanCount) : undefined}
              onPress={() => router.push('/loans')}
            />
            <ListRow icon="profit" label="রিপোর্ট" onPress={() => router.push('/reports')} />
          </ListCard>
        </AnimatedSection>

        <AnimatedSection index={2}>
          <ListCard>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: t.muted }]}>ব্যবসা</Text>
            </View>
            <ListRow icon="book" label="ব্যবসা শিক্ষা" badge="নতুন" onPress={() => router.push('/learning')} />
            {learningPreview.length > 0 ? (
              <View style={styles.previewRow}>
                {learningPreview.map((title) => (
                  <AnimatedPressable
                    key={title}
                    variant="chip"
                    style={[styles.previewChip, { backgroundColor: `${t.brand}18` }]}
                    onPress={() => router.push('/learning')}
                    haptic="light"
                  >
                    <Text style={[styles.previewText, { color: t.brand }]} numberOfLines={1}>
                      {title}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            ) : null}
            <ListRow icon="staff" label="স্টাফ" onPress={() => router.push('/staff')} />
          </ListCard>
        </AnimatedSection>

        <AnimatedSection index={3}>
          <ListCard>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: t.muted }]}>অ্যাকাউন্ট ও সেটিংস</Text>
            </View>
            <ListRow icon="backup" label="ব্যাকআপ ও রিস্টোর" onPress={() => router.push('/backup')} />
            <ListRow icon="settings" label="সেটিংস" onPress={() => router.push('/settings' as never)} />
            <ListRow icon="profile" label="প্রোফাইল" onPress={() => router.push('/profile')} />
            <ListRow icon="help" label="সাহায্য" onPress={() => router.push('/help')} />
          </ListCard>
        </AnimatedSection>

        <Button label="লগ আউট" variant="danger" onPress={logout} />
        <Text style={[styles.version, { color: t.muted }]}>আরোপন · সংস্করণ ১.০</Text>
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  section: { padding: spacing.md, gap: spacing.sm },
  listHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  listTitle: { ...typography.label },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  previewChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    maxWidth: '100%',
  },
  previewText: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },
  version: { ...typography.caption, textAlign: 'center' },
});
