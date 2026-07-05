import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useRepository } from '@/context/RepositoryContext';
import { goBackOr } from '@/lib/navigation';
import type { Product } from '@/types/schema';
import { spacing } from '@/constants/theme';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { repo } = useRepository();
  const { showSuccess, showError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const p = await repo.getProduct(String(id));
    if (p) {
      setProduct(p);
      setQty(String(p.qty));
      setSellPrice(String(p.sell_price));
    }
    setLoading(false);
  }, [id, repo]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await repo.updateProduct(product.id, {
        qty: Number(qty) || 0,
        sell_price: Number(sellPrice) || 0,
      });
      showSuccess('আপডেট হয়েছে');
      goBackOr('/(tabs)/inventory');
    } catch {
      showError('সংরক্ষণ ব্যর্থ');
    }
    setSaving(false);
  };

  if (loading) return <ScreenLoader />;

  return (
    <TabScreenShell>
      <ScreenHeader title={product?.name ?? 'পণ্য'} backFallback="/(tabs)/inventory" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Input label="স্টক পরিমাণ" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Input label="বিক্রয় মূল্য (৳)" value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" />
        <Button label="সংরক্ষণ করুন" onPress={submit} loading={saving} />
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
});
