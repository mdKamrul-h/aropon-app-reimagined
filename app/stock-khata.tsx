import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { HisabDarkScreen, useHisabScreenStyles } from '@/components/accounting/HisabDarkScreen';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useAppTheme } from '@/context/ThemeContext';
import type { Product } from '@/types/schema';
import { typography } from '@/constants/theme';
import { toBnDigits } from '@/utils/bn-numerals';

export default function StockKhataScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { colors, isDark } = useAppTheme();
  const hisabStyles = useHisabScreenStyles();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setProducts(await repo.getProducts(business.id));
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const stockValue = useMemo(() => products.reduce((sum, product) => sum + product.sell_price * product.qty, 0), [products]);
  const lowStock = useMemo(() => products.filter((product) => product.qty <= product.low_stock_threshold), [products]);

  return (
    <HisabDarkScreen title="স্টক খাতা" subtitle="পণ্য, ভ্যালু আর কম স্টক সব এক পাতায়">
      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          <View style={hisabStyles.statGrid}>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>মোট পণ্য</Text>
              <Text style={hisabStyles.statValue}>{toBnDigits(products.length)}</Text>
            </View>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>স্টক মূল্য</Text>
              <TakaAmount amount={stockValue} color={colors.brand} size="card" />
            </View>
          </View>
          <View
            style={[
              styles.lowBanner,
              {
                backgroundColor: isDark ? 'rgba(255,209,92,0.12)' : '#FFF8E9',
                borderColor: isDark ? 'rgba(255,209,92,0.24)' : '#F9D88D',
              },
            ]}
          >
            <Text style={styles.lowBannerTitle}>{toBnDigits(lowStock.length)} পণ্যের স্টক কম</Text>
            <Text style={[styles.lowBannerText, { color: colors.mutedDark }]}>যেগুলো আগে কিনতে হবে সেগুলো উপরে দেখানো আছে</Text>
          </View>

          <View style={hisabStyles.listCard}>
            {products
              .sort((a, b) => Number(a.qty - a.low_stock_threshold) - Number(b.qty - b.low_stock_threshold))
              .map((product, index) => {
                const low = product.qty <= product.low_stock_threshold;
                return (
                  <Pressable
                    key={product.id}
                    style={[hisabStyles.row, index === products.length - 1 && styles.lastRow]}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
                  >
                    <View
                      style={[
                        styles.iconTile,
                        {
                          backgroundColor: low
                            ? isDark
                              ? 'rgba(255,209,92,0.14)'
                              : '#FFF3D6'
                            : isDark
                              ? colors.successBg
                              : '#EDF9F0',
                        },
                      ]}
                    >
                      <AroponIcon name="inventory" size={24} color={low ? colors.amber : colors.iconPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={hisabStyles.rowTitle}>{product.name}</Text>
                      <Text style={hisabStyles.rowMeta}>
                        {toBnDigits(product.qty)} {product.unit} {low ? '· স্টক কম' : ''}
                      </Text>
                    </View>
                    <TakaAmount amount={product.sell_price} color={low ? colors.amber : colors.ink} size="sm" />
                  </Pressable>
                );
              })}
          </View>
        </>
      )}
    </HisabDarkScreen>
  );
}

const styles = StyleSheet.create({
  lowBanner: {
    backgroundColor: 'rgba(249,168,37,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(249,168,37,0.2)',
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  lowBannerTitle: {
    ...typography.label,
    color: '#D69207',
  },
  lowBannerText: {
    ...typography.caption,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
