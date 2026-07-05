import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { goBackOr } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { NumericKeypad } from '@/components/ui/NumericKeypad';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { ExpenseCategory, Party, PaymentMethod, Product, TransactionType } from '@/types/schema';
import { partyTypeSelectHint, partyTypeLabel } from '@/constants/partyLabels';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { PAYMENT_METHODS_UI, CASH_PAYMENT_TOGGLE_LABEL } from '@/constants/paymentMethods';
import { toBnDigits } from '@/utils/bn-numerals';

const BN_TO_EN: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

function PaymentMethodIcon({ method, size = 28 }: { method: PaymentMethod; size?: number }) {
  const r = Math.round(size * 0.28);
  const fs = Math.round(size * 0.52);
  const lh = size;

  if (method === 'cash') {
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: size * 0.84,
            height: size * 0.62,
            backgroundColor: '#1B5E20',
            borderRadius: r,
            opacity: 0.55,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: size * 0.18,
            width: size * 0.84,
            height: size * 0.62,
            backgroundColor: '#388E3C',
            borderRadius: r,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: fs - 2,
              fontFamily: fonts.bengaliBold,
              lineHeight: lh * 0.65,
            }}
          >
            ৳
          </Text>
        </View>
      </View>
    );
  }

  const configs: Record<string, { bg: string; label: string; round?: boolean }> = {
    bkash: { bg: '#E2136E', label: 'b', round: false },
    nagad: { bg: '#F6921E', label: 'N', round: true },
    rocket: { bg: '#8B2FC9', label: '🚀', round: false },
  };
  const c = configs[method];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: c.round ? size / 2 : r,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: fs, fontFamily: fonts.latinBold, lineHeight: lh }}>
        {c.label}
      </Text>
    </View>
  );
}

interface AmountPadProps {
  title: string;
  type: TransactionType;
  defaultCredit?: boolean;
  needsParty?: boolean;
  partyType?: 'customer' | 'dealer';
}

export default function TransactionScreen() {
  const params = useLocalSearchParams<{ partyId?: string; mode?: string; credit?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { showSuccess, showError } = useToast();
  const { resolvedTheme: theme } = useUiPreferences();
  const accent = theme.isDark ? '#2dd4bf' : theme.brand;
  const chipBg = theme.isDark ? 'rgba(255,255,255,0.08)' : colors.surface;
  const mode = String(params.mode ?? 'sale');
  const config: Record<string, AmountPadProps> = {
    sale: { title: 'নতুন বিক্রি', type: 'sale', defaultCredit: false, needsParty: false, partyType: 'customer' },
    purchase: { title: 'নতুন ক্রয়', type: 'purchase', defaultCredit: true, needsParty: true, partyType: 'dealer' },
    receive: { title: 'টাকা আদায়', type: 'payment_in', needsParty: true, partyType: 'customer' },
    pay: { title: 'টাকা দেওয়া', type: 'payment_out', needsParty: true, partyType: 'dealer' },
    expense: { title: 'খরচ', type: 'expense' },
  };
  const { title, type, defaultCredit, partyType } = config[mode] ?? config.sale;
  const creditFromParam = params.credit === '1';

  const [amountStr, setAmountStr] = useState('');
  const [isCredit, setIsCredit] = useState(creditFromParam || (defaultCredit ?? false));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [parties, setParties] = useState<Party[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partyId, setPartyId] = useState<string | undefined>(
    params.partyId ? String(params.partyId) : undefined,
  );
  const [productId, setProductId] = useState<string | undefined>();
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenseCategoryId, setExpenseCategoryId] = useState<string | undefined>();
  const [amountEditedByHand, setAmountEditedByHand] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(type === 'sale' || type === 'purchase' || type === 'expense');
  const [saving, setSaving] = useState(false);
  // When opened from a specific party's ledger (e.g. the "পেলাম +"/"দিলাম −"
  // buttons), the picker must reflect THAT party's actual type — not the
  // mode's default — or the pre-selected party silently fails to appear
  // in its own picker (a dealer opened via "receive" would look for it
  // among customers and never find it).
  const [resolvedPartyType, setResolvedPartyType] = useState<'customer' | 'dealer'>(
    partyType ?? 'customer',
  );

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    (async () => {
      let loadType: 'customer' | 'dealer' = partyType ?? 'customer';
      if (params.partyId) {
        const p = await repo.getParty(String(params.partyId));
        if (p) loadType = p.type;
      }
      if (cancelled) return;
      setResolvedPartyType(loadType);
      setParties(await repo.getParties(business.id, loadType));
    })();
    if (type === 'sale' || type === 'purchase') {
      repo.getProducts(business.id).then(setProducts);
    }
    if (type === 'expense') {
      repo.getExpenseCategories(business.id).then((cats) => {
        setExpenseCategories(cats);
        setExpenseCategoryId((prev) => prev ?? cats[0]?.id);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [business, repo, partyType, type, params.partyId]);

  useEffect(() => {
    if (creditFromParam) setIsCredit(true);
  }, [creditFromParam]);

  const onKey = (key: string) => {
    setAmountEditedByHand(true);
    if (key === 'back') {
      setAmountStr((s) => s.slice(0, -1));
      return;
    }
    setAmountStr((s) => s + key);
  };

  const amount = Number(
    amountStr
      .split('')
      .map((c) => BN_TO_EN[c] ?? c)
      .join('') || '0',
  );

  const partyRequired =
    (type === 'sale' && isCredit) ||
    type === 'payment_in' ||
    type === 'payment_out' ||
    (type === 'purchase' && isCredit);

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedExpenseCategory = expenseCategories.find((c) => c.id === expenseCategoryId);

  // Amount follows product × qty unless the shopkeeper has typed a value
  // by hand (e.g. to apply a discount) — once they touch the keypad, their
  // number wins until a different product/qty is picked.
  useEffect(() => {
    if (!selectedProduct || amountEditedByHand) return;
    const q = Number(qty) || 1;
    setAmountStr(String(selectedProduct.sell_price * q));
  }, [selectedProduct, qty, amountEditedByHand]);

  useEffect(() => {
    setAmountEditedByHand(false);
  }, [productId]);

  const buildNote = () => {
    if (note.trim()) return note.trim();
    if (type === 'expense') return selectedExpenseCategory?.name_bn ?? 'খরচ';
    if (selectedProduct) {
      const q = Number(qty) || 1;
      return q > 1 ? `${selectedProduct.name} × ${q}` : selectedProduct.name;
    }
    return title;
  };

  const save = async () => {
    if (!business || amount <= 0) {
      showError('সঠিক পরিমাণ দিন');
      return;
    }
    if (partyRequired && !partyId) {
      showError(partyTypeSelectHint(resolvedPartyType));
      return;
    }
    setSaving(true);
    try {
      const lineItems =
        selectedProduct && (type === 'sale' || type === 'purchase')
          ? [
              {
                name: selectedProduct.name,
                product_id: selectedProduct.id,
                qty: Number(qty) || 1,
                unit_price: selectedProduct.sell_price,
                total: amount,
              },
            ]
          : undefined;

      await repo.createTransaction({
        business_id: business.id,
        party_id: partyId ?? null,
        type,
        amount,
        payment_method: method,
        is_credit: type === 'sale' || type === 'purchase' ? isCredit : false,
        note: buildNote(),
        expense_category_id: type === 'expense' ? expenseCategoryId ?? null : null,
        line_items: lineItems,
      });
      showSuccess('সংরক্ষিত হয়েছে');
      goBackOr('/(tabs)');
    } catch {
      showError('সংরক্ষণ ব্যর্থ');
    }
    setSaving(false);
  };

  const selectedParty = parties.find((p) => p.id === partyId);
  const showPartyPicker =
    (type === 'sale' && isCredit) ||
    type === 'payment_in' ||
    type === 'payment_out' ||
    type === 'purchase';

  const showProductSection = type === 'sale' || type === 'purchase';

  return (
    <AppScreenShell variant="modal">
    <View style={[styles.root, { backgroundColor: theme.card }]}>
      <AppHeader variant="modal" title={title} backFallback="/(tabs)" />

      <ScrollView contentContainerStyle={styles.content}>
        <TakaAmount amount={amount} size="hero" color={accent} style={styles.amount} />

        {(type === 'sale' || type === 'purchase') && (
          <View style={styles.toggle}>
            {[
              { label: CASH_PAYMENT_TOGGLE_LABEL, val: false },
              { label: 'বাকি', val: true },
            ].map((opt) => (
              <Pressable
                key={opt.label}
                style={[
                  styles.toggleBtn,
                  { borderColor: theme.border },
                  isCredit === opt.val && { borderColor: accent, backgroundColor: `${accent}15` },
                ]}
                onPress={() => setIsCredit(opt.val)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: theme.mutedDark },
                    isCredit === opt.val && { color: accent },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {showPartyPicker && (
          <SurfaceCard style={styles.partyPicker}>
            <Text style={[styles.partyLabel, { color: theme.inkSecondary }]}>
              {partyTypeLabel(resolvedPartyType)}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partyScroll}>
              <Pressable
                style={[
                  styles.partyChipAdd,
                  { borderColor: accent, backgroundColor: `${accent}12` },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/party/new',
                    params: { type: resolvedPartyType },
                  })
                }
              >
                <Text style={[styles.partyChipAddText, { color: accent }]}>+ নতুন</Text>
              </Pressable>
              {parties.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.partyChip,
                    { backgroundColor: chipBg },
                    partyId === p.id && { backgroundColor: `${accent}20`, borderWidth: 1, borderColor: accent },
                  ]}
                  onPress={() => setPartyId(p.id)}
                >
                  <Text style={[styles.partyChipText, { color: theme.ink }]}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {selectedParty ? (
              <Text style={[styles.selectedParty, { color: accent }]}>{selectedParty.name}</Text>
            ) : null}
          </SurfaceCard>
        )}

        {isCredit && (type === 'sale' || type === 'purchase') ? null : (
          <View style={styles.methods}>
            {PAYMENT_METHODS_UI.map((m) => (
              <Pressable
                key={m.key}
                style={[
                  styles.methodChip,
                  { borderColor: theme.border },
                  method === m.key && { borderColor: accent },
                ]}
                onPress={() => setMethod(m.key)}
              >
                <PaymentMethodIcon method={m.key} size={28} />
                <Text style={[styles.methodText, { color: theme.ink }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={styles.detailsToggle} onPress={() => setDetailsOpen((o) => !o)}>
          <Text style={[styles.detailsToggleText, { color: accent }]}>
            বিস্তারিত (ঐচ্ছিক) {detailsOpen ? '▲' : '▼'}
          </Text>
        </Pressable>

        {detailsOpen ? (
          <SurfaceCard style={styles.detailsCard}>
            {showProductSection && products.length > 0 ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.mutedDark }]}>পণ্য</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {products.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.partyChip,
                        { backgroundColor: chipBg },
                        productId === p.id && { backgroundColor: `${accent}20`, borderWidth: 1, borderColor: accent },
                      ]}
                      onPress={() => setProductId(p.id)}
                    >
                      <Text style={[styles.partyChipText, { color: theme.ink }]}>{p.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={[styles.fieldLabel, { color: theme.mutedDark }]}>পরিমাণ</Text>
                <View style={styles.qtyRow}>
                  <Pressable
                    style={[styles.qtyBtn, { backgroundColor: `${accent}18` }]}
                    onPress={() => setQty((q) => String(Math.max(1, (Number(q) || 1) - 1)))}
                  >
                    <Text style={[styles.qtyBtnText, { color: accent }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.qtyValue, { color: theme.ink }]}>{qty}</Text>
                  <Pressable
                    style={[styles.qtyBtn, { backgroundColor: `${accent}18` }]}
                    onPress={() => setQty((q) => String((Number(q) || 1) + 1))}
                  >
                    <Text style={[styles.qtyBtnText, { color: accent }]}>+</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {type === 'expense' ? (
              <>
                <Text style={[styles.fieldLabel, { color: theme.mutedDark }]}>খরচের ধরন</Text>
                <View style={styles.categoryRow}>
                  {expenseCategories.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.partyChip,
                        { backgroundColor: chipBg },
                        expenseCategoryId === c.id && { backgroundColor: `${accent}20`, borderWidth: 1, borderColor: accent },
                      ]}
                      onPress={() => setExpenseCategoryId(c.id)}
                    >
                      <Text style={[styles.partyChipText, { color: theme.ink }]}>{c.name_bn}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={[styles.fieldLabel, { color: theme.mutedDark }]}>নোট</Text>
            <TextInput
              style={[styles.noteInput, { borderColor: theme.border, color: theme.ink, backgroundColor: chipBg }]}
              value={note}
              onChangeText={setNote}
              placeholder="বিস্তারিত লিখুন"
              placeholderTextColor={theme.muted}
            />
          </SurfaceCard>
        ) : null}

        <NumericKeypad onKey={onKey} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: theme.border }]}>
        <Button label={`সংরক্ষণ করুন · ৳ ${toBnDigits(amount)}`} onPress={save} loading={saving} />
      </View>
    </View>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  back: { fontSize: 24 },
  title: { ...typography.screenTitle },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  amount: { textAlign: 'center' },
  toggle: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  toggleBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  toggleText: { ...typography.body },
  partyPicker: { gap: spacing.sm },
  partyLabel: { ...typography.bodySm },
  partyScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
  partyChipAdd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  partyChipAddText: { ...typography.bodySm, fontFamily: fonts.bengaliSemiBold },
  partyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  partyChipText: { ...typography.bodySm },
  selectedParty: { ...typography.caption },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
  },
  methodText: { ...typography.bodySm },
  detailsToggle: { alignItems: 'center', paddingVertical: spacing.sm },
  detailsToggleText: { ...typography.label },
  detailsCard: { gap: spacing.md },
  fieldLabel: { ...typography.caption },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, alignSelf: 'center' },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 22, fontFamily: fonts.bengaliBold },
  qtyValue: { ...typography.sectionTitle, minWidth: 32, textAlign: 'center' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  noteInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.bodySm,
  },
  footer: { padding: spacing.lg, borderTopWidth: 1 },
});
