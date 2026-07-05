import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { AppCard } from '@/components/layout/AppCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { ListCard } from '@/components/layout/ListCard';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { SearchField } from '@/components/ui/SearchField';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { CATEGORY_ALL_ID, categoryNameById } from '@/constants/productCategories';
import type { Category, Product } from '@/types/schema';
import { toBnDigits } from '@/utils/bn-numerals';
import { fonts, spacing, typography } from '@/constants/theme';

function matchesQuery(name: string, query: string) {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export default function InventoryScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(CATEGORY_ALL_ID);
  const [query, setQuery] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setError('');
    try {
      setProducts(await repo.getProducts(business.id));
      setCategories(await repo.getCategories(business.id));
    } catch {
      setError('ডেটা লোড করা যায়নি');
    }
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryOptions = useMemo(
    () => [
      { key: CATEGORY_ALL_ID, label: 'সব' },
      ...categories.map((c) => ({ key: c.id, label: c.name })),
    ],
    [categories],
  );

  if (!business) return null;

  const stockValue = products.reduce((s, p) => s + p.sell_price * p.qty, 0);
  const lowCount = products.filter((p) => p.qty <= p.low_stock_threshold).length;
  const filtered = products
    .filter((p) => matchesQuery(p.name, query))
    .filter((p) => !lowOnly || p.qty <= p.low_stock_threshold)
    .filter((p) => categoryId === CATEGORY_ALL_ID || p.category_id === categoryId);
  const noResults = (query.trim().length > 0 || lowOnly) && filtered.length === 0;

  const headerExtra = (
    <AppCard style={styles.banner}>
      <Text style={[styles.bannerLabel, { color: 'rgba(255,255,255,0.85)' }]}>স্টক মূল্য</Text>
      <TakaAmount amount={stockValue} color="#fff" />
      {lowCount > 0 ? (
        <AnimatedPressable onPress={() => setLowOnly((v) => !v)} haptic="light">
          <Text style={[styles.lowAlert, lowOnly && styles.lowAlertActive]}>
            {toBnDigits(lowCount)} পণ্যের স্টক কম {lowOnly ? '· ফিল্টার চালু' : ''}
          </Text>
        </AnimatedPressable>
      ) : null}
    </AppCard>
  );

  return (
    <AppScreenShell variant="tabRoot">
      <AppHeader variant="tabRoot" title="মালামাল" shopName="মালামাল" shopMeta={business.name}>
        {headerExtra}
      </AppHeader>

      <SearchField value={query} onChangeText={setQuery} noResults={noResults} />

      <View style={[styles.categoryBar, { borderBottomColor: t.border, backgroundColor: t.card }]}>
        <Chip options={categoryOptions} value={categoryId} onChange={setCategoryId} scrollable />
        {lowCount > 0 ? (
          <AnimatedPressable
            style={[styles.filterChip, lowOnly && { backgroundColor: t.amber }]}
            onPress={() => setLowOnly((v) => !v)}
            haptic="light"
          >
            <Text style={[styles.filterChipText, { color: lowOnly ? '#fff' : t.amber }]}>
              কম স্টক {lowOnly ? '✓' : ''}
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {error ? (
        <AnimatedPressable
          style={[styles.errorBanner, { backgroundColor: t.payTint }]}
          onPress={() => void load()}
          haptic="light"
        >
          <Text style={[styles.errorText, { color: t.pay }]}>{error} · আবার চেষ্টা করুন</Text>
        </AnimatedPressable>
      ) : null}

      {loading ? (
        <ScreenLoader skeleton />
      ) : products.length === 0 ? (
        <EmptyState
          icon="grocery"
          title="কোনো পণ্য নেই"
          ctaLabel="+ পণ্য যোগ করুন"
          onCta={() => router.push('/product/new')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 }}
          renderItem={({ item, index }) => {
            const low = item.qty <= item.low_stock_threshold;
            return (
              <Animated.View entering={FadeInUp.duration(350).delay(index * 40)}>
                <ListCard>
                  <AnimatedPressable
                    variant="row"
                    style={styles.rowInner}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                    haptic="light"
                  >
                    <View style={[styles.thumb, { backgroundColor: t.cardTint }]}>
                      <AroponIcon name="grocery" size={32} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: t.ink }]}>{item.name}</Text>
                      <Text style={[styles.qty, { color: t.mutedDark }, low && { color: t.pay }]}>
                        {categoryNameById(item.category_id) ? `${categoryNameById(item.category_id)} · ` : ''}
                        {toBnDigits(item.qty)} {item.unit}
                        {low ? ' · স্টক কম' : ''}
                      </Text>
                    </View>
                    <TakaAmount amount={item.sell_price} size="sm" />
                  </AnimatedPressable>
                </ListCard>
              </Animated.View>
            );
          }}
        />
      )}
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 4,
  },
  bannerLabel: { ...typography.caption },
  lowAlert: {
    ...typography.caption,
    color: '#F9A825',
    backgroundColor: 'rgba(249,168,37,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: spacing.xs,
  },
  lowAlertActive: { backgroundColor: '#F9A825', color: '#fff' },
  categoryBar: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(249,168,37,0.15)',
  },
  filterChipText: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  qty: { ...typography.caption },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  errorText: { ...typography.caption, textAlign: 'center' },
});
