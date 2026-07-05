import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { goBackOr } from '@/lib/navigation';
import type { Category, Product } from '@/types/schema';
import { fonts, radius, spacing, typography } from '@/constants/theme';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const { showSuccess, showError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [qty, setQty] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [lowStock, setLowStock] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id || !business) return;
    setLoading(true);
    const [p, cats] = await Promise.all([
      repo.getProduct(String(id)),
      repo.getCategories(business.id),
    ]);
    setCategories(cats);
    if (p) {
      setProduct(p);
      setName(p.name);
      setUnit(p.unit);
      setQty(String(p.qty));
      setCostPrice(String(p.cost_price));
      setSellPrice(String(p.sell_price));
      setLowStock(String(p.low_stock_threshold));
      setCategoryId(p.category_id);
    }
    setLoading(false);
  }, [id, business, repo]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!product) return;
    if (!name.trim()) {
      showError('পণ্যের নাম দিন');
      return;
    }
    setSaving(true);
    try {
      await repo.updateProduct(product.id, {
        name: name.trim(),
        unit: unit.trim() || product.unit,
        qty: Number(qty) || 0,
        cost_price: Number(costPrice) || 0,
        sell_price: Number(sellPrice) || 0,
        low_stock_threshold: Number(lowStock) || 5,
        category_id: categoryId,
      });
      showSuccess('আপডেট হয়েছে');
      goBackOr('/(tabs)/inventory');
    } catch {
      showError('সংরক্ষণ ব্যর্থ');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <TabScreenShell>
        <ScreenHeader title="পণ্য" backFallback="/(tabs)/inventory" />
        <ScreenLoader />
      </TabScreenShell>
    );
  }

  return (
    <TabScreenShell>
      <ScreenHeader title={product?.name ?? 'পণ্য'} backFallback="/(tabs)/inventory" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Input label="পণ্যের নাম" value={name} onChangeText={setName} />

        <Text style={[styles.label, { color: t.mutedDark }]}>বিভাগ</Text>
        <View style={styles.chips}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={[
                styles.chip,
                { borderColor: t.border, backgroundColor: t.card },
                categoryId === c.id && { borderColor: t.brand, backgroundColor: `${t.brand}18` },
              ]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: t.mutedDark },
                  categoryId === c.id && { color: t.brand, fontFamily: fonts.bengaliSemiBold },
                ]}
              >
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="একক" value={unit} onChangeText={setUnit} />
        <Input label="স্টক পরিমাণ" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input label="ক্রয় মূল্য (৳)" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />
        <Input label="বিক্রয় মূল্য (৳)" value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" />
        <Input label="কম স্টক সতর্কতা" value={lowStock} onChangeText={setLowStock} keyboardType="numeric" />
        <Button label="সংরক্ষণ করুন" onPress={submit} loading={saving} />
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  label: { ...typography.label },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { ...typography.bodySm },
});
