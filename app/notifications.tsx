import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { Loan, Product } from '@/types/schema';
import { toBnDigits } from '@/utils/bn-numerals';
import { fonts, spacing, typography } from '@/constants/theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const [l, p] = await Promise.all([
      repo.getLoans(business.id, 'active'),
      repo.getProducts(business.id),
    ]);
    setLoans(l);
    setProducts(p);
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const dueLoans = loans.filter((l) => l.next_due_date === today);
  const lowStock = products.filter((p) => p.qty <= p.low_stock_threshold);

  const items = [
    ...dueLoans.map((l) => ({
      key: l.id,
      title: `${l.lender_name} — কিস্তি আজ`,
      sub: `বাকি ৳${toBnDigits(l.outstanding)}`,
      onPress: () => router.push('/loans'),
    })),
    ...lowStock.map((p) => ({
      key: p.id,
      title: `${p.name} — স্টক কম`,
      sub: `মাত্র ${toBnDigits(p.qty)} ${p.unit}`,
      onPress: () => router.push({ pathname: '/product/[id]', params: { id: p.id } }),
    })),
    {
      key: 'day-close',
      title: 'দিন শেষের হিসাব মিলান',
      sub: 'সন্ধ্যা ৯টার আগে হিসাব মিলিয়ে নিন',
      onPress: () => router.push('/(tabs)/accounting'),
    },
  ];

  return (
    <TabScreenShell withNav tabActive="home">
      <ScreenHeader title="বিজ্ঞপ্তি" backFallback="/(tabs)" />
      {loading ? (
        <ScreenLoader />
      ) : items.length === 0 ? (
        <EmptyState icon="bell" title="কোনো বিজ্ঞপ্তি নেই" />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
          {items.map((item) => (
            <Pressable key={item.key} onPress={item.onPress}>
              <SurfaceCard style={styles.row}>
                <Text style={[styles.title, { color: t.ink }]}>{item.title}</Text>
                <Text style={[styles.sub, { color: t.muted }]}>{item.sub}</Text>
              </SurfaceCard>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm },
  row: { gap: 4 },
  title: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  sub: { ...typography.caption },
});
