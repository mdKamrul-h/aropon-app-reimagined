import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { goBackOr } from '@/lib/navigation';
import type { Category } from '@/types/schema';
import { fonts, radius, spacing, typography } from '@/constants/theme';

export default function NewProductScreen() {
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { showSuccess, showError } = useToast();
  const { resolvedTheme: t } = useUiPreferences();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('পিস');
  const [qty, setQty] = useState('0');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [lowStock, setLowStock] = useState('5');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!business) return;
    repo.getCategories(business.id).then((cats) => {
      setCategories(cats);
      if (cats[0]) setCategoryId(cats[0].id);
    });
  }, [business, repo]);

  const submit = async () => {
    if (!business || !name.trim()) {
      showError('পণ্যের নাম দিন');
      return;
    }
    setLoading(true);
    try {
      await repo.createProduct(business.id, {
        name: name.trim(),
        unit,
        qty: Number(qty) || 0,
        cost_price: Number(costPrice) || 0,
        sell_price: Number(sellPrice) || 0,
        low_stock_threshold: Number(lowStock) || 5,
        category_id: categoryId,
      });
      showSuccess('পণ্য যোগ হয়েছে');
      goBackOr('/(tabs)/inventory');
    } catch {
      showError('সংরক্ষণ ব্যর্থ');
    }
    setLoading(false);
  };

  return (
    <TabScreenShell variant="modal">
      <ScreenHeader variant="modal" title="নতুন পণ্য" backFallback="/(tabs)/inventory" />
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
        <Input label="পরিমাণ" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input label="ক্রয় মূল্য (৳)" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />
        <Input label="বিক্রয় মূল্য (৳)" value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" />
        <Input label="কম স্টক সতর্কতা" value={lowStock} onChangeText={setLowStock} keyboardType="numeric" />
        <Button label="সংরক্ষণ করুন" onPress={submit} loading={loading} />
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
