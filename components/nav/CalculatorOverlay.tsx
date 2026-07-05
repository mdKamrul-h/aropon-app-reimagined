import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { goBackOr } from '@/lib/navigation';
import type { Party, TransactionInput } from '@/types/schema';
import { formatTakaBnAmount, toBnDigits } from '@/utils/bn-numerals';

type ActionMode = 'sale' | 'credit' | 'payment' | 'expense';
type ActionCategory = 'বিক্রয়' | 'মুদি' | 'পোশাক' | 'অন্যান্য';
type ExpenseCategory = 'কেনাকাটা' | 'ভাড়া' | 'বেতন' | 'পরিবহন' | 'ইউটিলিটি' | 'অন্যান্য';

const ACTIONS: { key: ActionMode; label: string; icon: IconName }[] = [
  { key: 'sale', label: 'বিক্রি', icon: 'orders' },
  { key: 'credit', label: 'বাকি', icon: 'receipt' },
  { key: 'payment', label: 'পরিশোধ', icon: 'income' },
  { key: 'expense', label: 'খরচ', icon: 'wallet' },
];

const SALE_CATEGORIES: ActionCategory[] = ['বিক্রয়', 'মুদি', 'পোশাক', 'অন্যান্য'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['কেনাকাটা', 'ভাড়া', 'বেতন', 'পরিবহন', 'ইউটিলিটি', 'অন্যান্য'];
const MAX_RECENT_CUSTOMERS = 4;
const MAX_NOTE = 120;

function isOperator(token: string) {
  return ['+', '-', '*', '/', '%'].includes(token);
}

function formatExpressionForDisplay(expression: string) {
  return toBnDigits(expression.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' - ').replace(/%/g, '%'));
}

function normalizePercent(expression: string) {
  return expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
}

function safeEvaluate(expression: string) {
  if (!expression.trim()) return 0;
  const sanitized = normalizePercent(expression).replace(/\s+/g, '');
  if (!/^[0-9+\-*/().%]+$/.test(sanitized)) return null;
  try {
    const value = Function(`"use strict"; return (${sanitized});`)();
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function decimalPlaces(value: number) {
  const parts = String(value).split('.');
  return parts[1]?.length ?? 0;
}

function formatResult(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(Math.min(2, decimalPlaces(value))).replace(/\.?0+$/, '');
}

function getLastNumberMeta(expression: string) {
  const match = expression.match(/(-?\d*\.?\d+)(?!.*\d)/);
  if (!match || match.index == null) return null;
  return {
    value: match[0],
    start: match.index,
    end: match.index + match[0].length,
  };
}

function toggleLastNumber(expression: string) {
  const meta = getLastNumberMeta(expression);
  if (!meta) return expression ? `-${expression}` : '-';
  const prefix = expression.slice(0, meta.start);
  const suffix = expression.slice(meta.end);
  const next = meta.value.startsWith('-') ? meta.value.slice(1) : `-${meta.value}`;
  return `${prefix}${next}${suffix}`;
}

function appendToken(current: string, token: string) {
  if (token === '.') {
    const meta = getLastNumberMeta(current);
    if (!meta) return `${current}0.`;
    if (meta.value.includes('.')) return current;
    return `${current}.`;
  }

  if (token === '(') {
    if (!current || isOperator(current.slice(-1)) || current.slice(-1) === '(') return `${current}(`;
    return `${current}*(`;
  }

  if (token === ')') {
    const opens = (current.match(/\(/g) ?? []).length;
    const closes = (current.match(/\)/g) ?? []).length;
    if (opens <= closes || !current || isOperator(current.slice(-1)) || current.slice(-1) === '(') return current;
    return `${current})`;
  }

  if (token === '%') {
    const meta = getLastNumberMeta(current);
    if (!meta || current.slice(-1) === '%') return current;
    return `${current}%`;
  }

  if (isOperator(token)) {
    if (!current) return token === '-' ? '-' : current;
    if (isOperator(current.slice(-1))) {
      return `${current.slice(0, -1)}${token}`;
    }
    if (current.slice(-1) === '(' && token !== '-') return current;
    return `${current}${token}`;
  }

  if (current === '0') return token;
  return `${current}${token}`;
}

function deriveSaleDraft(expression: string, result: number) {
  const compact = expression.replace(/\s+/g, '');
  const subtraction = compact.match(/^(\d+(?:\.\d+)?)\-(\d+(?:\.\d+)?)$/);
  if (!subtraction) {
    return {
      amount: Math.abs(result),
      cashReceived: Math.max(result, 0),
      change: 0,
      expressionLabel: formatExpressionForDisplay(expression),
    };
  }

  const cashReceived = Number(subtraction[1]);
  const saleAmount = Number(subtraction[2]);
  const change = Math.max(result, 0);

  return {
    amount: saleAmount,
    cashReceived,
    change,
    expressionLabel: `${toBnDigits(subtraction[1])} - ${toBnDigits(subtraction[2])}`,
  };
}

function formatTransactionNote(prefix: string, category: string, note: string) {
  const trimmed = note.trim();
  return trimmed ? `${prefix} · ${category} · ${trimmed}` : `${prefix} · ${category}`;
}

function sortCustomers(parties: Party[]) {
  return [...parties].sort((a, b) => {
    const timeA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const timeB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return a.name.localeCompare(b.name, 'bn');
  });
}

function filterCustomers(parties: Party[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return parties;
  return parties.filter((party) =>
    party.name.toLowerCase().includes(normalized) ||
    (party.phone ?? '').includes(normalized),
  );
}

interface CustomerPickerSheetProps {
  customers: Party[];
  selectedCustomerId: string | null;
  onSelect: (customerId: string) => void;
  onClose: () => void;
  onCreateCustomer: () => void;
}

function CustomerPickerSheet({
  customers,
  selectedCustomerId,
  onSelect,
  onClose,
  onCreateCustomer,
}: CustomerPickerSheetProps) {
  const { colors, isDark } = useAppTheme();
  const [query, setQuery] = useState('');
  const filteredCustomers = useMemo(() => filterCustomers(customers, query), [customers, query]);

  return (
    <View style={styles.pickerWrap}>
      <Pressable style={[styles.pickerBackdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.pickerSheet, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
        <View style={[styles.handle, { backgroundColor: isDark ? colors.borderStrong : colors.muted }]} />
        <View style={styles.pickerHeader}>
          <Text style={[styles.sheetTitle, { color: colors.ink }]}>কাস্টমার নির্বাচন করুন</Text>
          <Pressable onPress={onClose} style={styles.pickerCloseBtn}>
            <Text style={[styles.pickerCloseText, { color: colors.brand }]}>বন্ধ</Text>
          </Pressable>
        </View>

        <Input
          placeholder="নাম বা ফোন দিয়ে খুঁজুন"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={[
            styles.pickerSearchInput,
            {
              backgroundColor: isDark ? colors.cardAlt : colors.card,
              color: colors.ink,
              borderColor: colors.border,
            },
          ]}
        />

        <Pressable
          style={[
            styles.createCustomerRow,
            {
              backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt,
              borderColor: colors.borderStrong,
            },
          ]}
          onPress={onCreateCustomer}
        >
          <Text style={[styles.createPartyText, { color: colors.brand }]}>+ নতুন কাস্টমার</Text>
        </Pressable>

        <ScrollView style={styles.pickerList} contentContainerStyle={styles.pickerListContent}>
          {filteredCustomers.map((party) => {
            const isSelected = selectedCustomerId === party.id;
            return (
              <Pressable
                key={party.id}
                style={[
                  styles.customerRow,
                  {
                    backgroundColor: isDark ? colors.cardAlt : colors.card,
                    borderColor: colors.border,
                  },
                  isSelected && {
                    borderColor: colors.brand,
                    backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt,
                  },
                ]}
                onPress={() => {
                  onSelect(party.id);
                  onClose();
                }}
              >
                <View style={styles.customerRowMain}>
                  <Text style={[styles.customerRowName, { color: colors.ink }, isSelected && { color: colors.brand }]}>{party.name}</Text>
                  <Text style={[styles.customerRowMeta, { color: colors.mutedDark }]}>
                    {party.phone || 'ফোন নেই'} {party.last_activity_at ? `· ${toBnDigits(new Date(party.last_activity_at).toLocaleDateString('bn-BD'))}` : ''}
                  </Text>
                </View>
                <View style={styles.customerRowRight}>
                  <Text style={[styles.customerRowBalance, { color: colors.amber }, isSelected && { color: colors.brandLight }]}>
                    ৳{formatTakaBnAmount(Math.max(party.balance, 0))}
                  </Text>
                  <Text style={[styles.customerRowBalanceLabel, { color: colors.muted }]}>বাকি</Text>
                </View>
              </Pressable>
            );
          })}

          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyPickerState}>
              <Text style={[styles.emptyPickerTitle, { color: colors.ink }]}>কোনো কাস্টমার পাওয়া যায়নি</Text>
              <Text style={[styles.emptyPickerText, { color: colors.mutedDark }]}>অন্য নাম দিয়ে খুঁজুন বা নতুন কাস্টমার যোগ করুন</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

interface ActionSheetProps {
  mode: ActionMode;
  amount: number;
  expression: string;
  customers: Party[];
  onClose: () => void;
  onSubmit: (input: TransactionInput, successMessage: string) => Promise<void>;
  onCreateCustomer: () => void;
}

function ActionSheet({
  mode,
  amount,
  expression,
  customers,
  onClose,
  onSubmit,
  onCreateCustomer,
}: ActionSheetProps) {
  const { colors, isDark } = useAppTheme();
  const saleDraft = useMemo(() => deriveSaleDraft(expression, amount), [amount, expression]);
  const sortedCustomers = useMemo(() => sortCustomers(customers), [customers]);
  const recentCustomers = useMemo(() => sortedCustomers.slice(0, MAX_RECENT_CUSTOMERS), [sortedCustomers]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(sortedCustomers[0]?.id ?? null);
  const [saleCategory, setSaleCategory] = useState<ActionCategory>('বিক্রয়');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('কেনাকাটা');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setSelectedCustomerId((current) => {
      if (current && customers.some((party) => party.id === current)) return current;
      return sortedCustomers[0]?.id ?? null;
    });
  }, [customers, sortedCustomers]);

  const selectedCustomer = sortedCustomers.find((party) => party.id === selectedCustomerId) ?? null;
  const remainingDue = selectedCustomer ? Math.max(selectedCustomer.balance - amount, 0) : 0;
  const totalDue = selectedCustomer ? selectedCustomer.balance + amount : amount;

  const save = async () => {
    let payload: TransactionInput | null = null;
    let successMessage = 'সংরক্ষণ হয়েছে';

    if (mode === 'sale') {
      payload = {
        business_id: '',
        type: 'sale',
        amount: saleDraft.amount,
        payment_method: 'cash',
        is_credit: false,
        note: formatTransactionNote('বিক্রি', saleCategory, note),
      };
      successMessage = `বিক্রি সেভ হয়েছে · ৳${formatTakaBnAmount(saleDraft.amount)}`;
    }

    if (mode === 'credit') {
      if (!selectedCustomer) return;
      payload = {
        business_id: '',
        party_id: selectedCustomer.id,
        type: 'sale',
        amount,
        payment_method: 'cash',
        is_credit: true,
        note: formatTransactionNote('বাকি', saleCategory, note),
      };
      successMessage = `বাকি যোগ হয়েছে · ৳${formatTakaBnAmount(amount)}`;
    }

    if (mode === 'payment') {
      if (!selectedCustomer) return;
      payload = {
        business_id: '',
        party_id: selectedCustomer.id,
        type: 'payment_in',
        amount,
        payment_method: 'cash',
        is_credit: false,
        note: formatTransactionNote('পরিশোধ', 'খদ্দের', note),
      };
      successMessage = `পরিশোধ যোগ হয়েছে · ৳${formatTakaBnAmount(amount)}`;
    }

    if (mode === 'expense') {
      payload = {
        business_id: '',
        type: 'expense',
        amount,
        payment_method: 'cash',
        is_credit: false,
        note: formatTransactionNote('খরচ', expenseCategory, note),
      };
      successMessage = `খরচ সেভ হয়েছে · ৳${formatTakaBnAmount(amount)}`;
    }

    if (!payload) return;

    setSaving(true);
    await onSubmit(payload, successMessage);
    setSaving(false);
  };

  const title =
    mode === 'sale'
      ? 'বিক্রি যোগ করুন'
      : mode === 'credit'
        ? 'বাকি যোগ করুন'
        : mode === 'payment'
          ? 'বাকি পরিশোধ'
          : 'খরচ যোগ করুন';

  const subtitle =
    mode === 'sale'
      ? 'ক্যালকুলেশন থেকে বিক্রির হিসাব নেওয়া হয়েছে'
      : mode === 'credit'
        ? 'কাস্টমারের বাকিতে যুক্ত হবে'
        : mode === 'payment'
          ? 'কাস্টমারের বাকি টাকা কমে যাবে'
          : 'দোকানের খরচ লিখে রাখুন';

  const accentColor =
    mode === 'sale'
      ? colors.brand
      : mode === 'credit'
        ? colors.amber
        : mode === 'payment'
          ? colors.receive
          : colors.pay;

  return (
    <View style={styles.sheetWrap}>
      <Pressable style={[styles.sheetBackdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.borderStrong }]}>
        <View style={[styles.handle, { backgroundColor: isDark ? colors.borderStrong : colors.muted }]} />
        <View style={styles.sheetHeader}>
          <AroponIcon
            name={mode === 'sale' ? 'orders' : mode === 'credit' ? 'receipt' : mode === 'payment' ? 'income' : 'wallet'}
            size={28}
            color={mode === 'expense' ? colors.pay : colors.iconPrimary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>{title}</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.mutedDark }]}>{subtitle}</Text>
          </View>
        </View>

        <Text style={[styles.heroAmount, { color: accentColor }]}>৳{formatTakaBnAmount(mode === 'sale' ? saleDraft.amount : amount)}</Text>

        {mode === 'sale' ? (
          <View style={styles.twoCol}>
            <View style={[styles.infoCard, { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedDark }]}>নগদ নিয়েছেন</Text>
              <Text style={[styles.infoValue, { color: colors.ink }]}>৳{formatTakaBnAmount(saleDraft.cashReceived)}</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedDark }]}>ফেরত দিয়েছেন</Text>
              <Text style={[styles.infoValue, { color: colors.ink }]}>৳{formatTakaBnAmount(saleDraft.change)}</Text>
            </View>
          </View>
        ) : null}

        {(mode === 'credit' || mode === 'payment') && selectedCustomer ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedDark }]}>{mode === 'credit' ? 'কাস্টমার বাছাই করুন' : 'কাস্টমার'}</Text>
            <Pressable style={[styles.partyCard, { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border }]} onPress={() => setPickerOpen(true)}>
              <AroponIcon name="customers" size={24} color={colors.iconPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.partyName, { color: colors.ink }]}>{selectedCustomer.name}</Text>
                <Text style={[styles.partyMeta, { color: colors.amber }]}>
                  {mode === 'credit' ? 'আগের বাকি' : 'বর্তমান বাকি'} ৳{formatTakaBnAmount(Math.max(selectedCustomer.balance, 0))}
                </Text>
              </View>
              <Text style={[styles.changeCustomerText, { color: colors.brand }]}>পরিবর্তন</Text>
            </Pressable>
          </>
        ) : null}

        {(mode === 'credit' || mode === 'payment') ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partyChips}>
            <Pressable
              style={[
                styles.createPartyChip,
                { borderColor: colors.borderStrong, backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt },
              ]}
              onPress={onCreateCustomer}
            >
              <Text style={[styles.createPartyText, { color: colors.brand }]}>+ নতুন কাস্টমার</Text>
            </Pressable>
            {recentCustomers.map((party) => (
              <Pressable
                key={party.id}
                style={[
                  styles.partyChip,
                  { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border },
                  selectedCustomerId === party.id && { backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt, borderColor: colors.brand },
                ]}
                onPress={() => setSelectedCustomerId(party.id)}
              >
                <Text style={[styles.partyChipText, { color: colors.mutedDark }, selectedCustomerId === party.id && { color: colors.brand }]}>
                  {party.name}
                </Text>
              </Pressable>
            ))}
            {sortedCustomers.length > MAX_RECENT_CUSTOMERS ? (
              <Pressable
                style={[
                  styles.moreCustomersChip,
                  { backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt, borderColor: colors.borderStrong },
                ]}
                onPress={() => setPickerOpen(true)}
              >
                <Text style={[styles.moreCustomersText, { color: colors.brand }]}>সব কাস্টমার</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}

        {(mode === 'credit' || mode === 'payment') && selectedCustomer ? (
          <View style={styles.twoCol}>
            <View style={[styles.infoCard, { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedDark }]}>{mode === 'credit' ? 'মোট বাকি হবে' : 'পরিশোধ'}</Text>
              <Text style={[styles.infoValue, { color: mode === 'payment' ? colors.white : colors.amber }]}>
                ৳{formatTakaBnAmount(mode === 'credit' ? totalDue : amount)}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedDark }]}>{mode === 'credit' ? 'তারিখ' : 'বাকি থাকবে'}</Text>
              <Text style={[styles.infoValue, { color: mode === 'credit' ? colors.white : colors.amber }]}>
                {mode === 'credit' ? 'আজ' : `৳${formatTakaBnAmount(remainingDue)}`}
              </Text>
            </View>
          </View>
        ) : null}

        {(mode === 'sale' || mode === 'credit') ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedDark }]}>ক্যাটাগরি</Text>
            <View style={styles.categoryWrap}>
              {SALE_CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border },
                    saleCategory === category && { backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt, borderColor: colors.brand },
                  ]}
                  onPress={() => setSaleCategory(category)}
                >
                  <Text style={[styles.categoryText, { color: colors.mutedDark }, saleCategory === category && { color: colors.brand }]}>{category}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {mode === 'expense' ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedDark }]}>খরচের ধরন</Text>
            <View style={styles.categoryWrap}>
              {EXPENSE_CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: isDark ? colors.cardAlt : colors.cardAlt, borderColor: colors.border },
                    expenseCategory === category && { backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceAlt, borderColor: colors.brand },
                  ]}
                  onPress={() => setExpenseCategory(category)}
                >
                  <Text style={[styles.categoryText, { color: colors.mutedDark }, expenseCategory === category && { color: colors.brand }]}>{category}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Input
          label="নোট"
          placeholder="নোট লিখুন (ঐচ্ছিক)"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={(value) => setNote(value.slice(0, MAX_NOTE))}
          style={[
            styles.noteInput,
            {
              backgroundColor: isDark ? colors.cardAlt : colors.card,
              color: colors.ink,
              borderColor: colors.border,
            },
          ]}
        />

        <Button
          label={
            mode === 'sale'
              ? 'বিক্রি নিশ্চিত করুন'
              : mode === 'credit'
                ? 'বাকি নিশ্চিত করুন'
                : mode === 'payment'
                  ? 'পরিশোধ নিশ্চিত করুন'
                  : 'খরচ নিশ্চিত করুন'
          }
          onPress={save}
          loading={saving}
          disabled={(mode === 'credit' || mode === 'payment') && !selectedCustomer}
          style={styles.confirmButton}
        />
      </View>

      {pickerOpen ? (
        <CustomerPickerSheet
          customers={sortedCustomers}
          selectedCustomerId={selectedCustomerId}
          onSelect={setSelectedCustomerId}
          onClose={() => setPickerOpen(false)}
          onCreateCustomer={onCreateCustomer}
        />
      ) : null}
    </View>
  );
}

export function CalculatorScreenContent() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { colors, isDark } = useAppTheme();
  const { showError, showSuccess } = useToast();
  const [expression, setExpression] = useState('');
  const [customers, setCustomers] = useState<Party[]>([]);
  const [activeAction, setActiveAction] = useState<ActionMode | null>(null);

  const isCompact = windowHeight < 780;
  const compactDisplayMinHeight = isCompact ? 88 : 140;
  const compactDisplayFontSize = isCompact ? 46 : 58;
  const compactDisplayLineHeight = isCompact ? 54 : 68;
  const compactActionPadding = isCompact ? spacing.sm : spacing.md;
  const compactActionGap = isCompact ? 4 : 6;
  const compactActionLabelSize = isCompact ? 13 : 15;
  const compactTopPadding = isCompact ? insets.top + 12 : insets.top + 20;
  const compactBottomPadding = isCompact ? insets.bottom + 24 : insets.bottom + 86;
  const compactTopBarMargin = isCompact ? spacing.md : spacing.lg;
  const compactSectionGap = isCompact ? spacing.md : spacing.lg;
  const compactKeypadTop = isCompact ? spacing.md : spacing.lg;
  const keyGap = spacing.sm;
  const keyRowCount = 5;
  const widthBoundKeySize = (windowWidth - spacing.lg * 2 - keyGap * 3) / 4;
  const availableHeight = windowHeight - compactTopPadding - compactBottomPadding - compactDisplayMinHeight - 120;
  const heightBoundKeySize = (availableHeight - keyGap * (keyRowCount - 1)) / keyRowCount;
  const keySize = Math.max(44, Math.min(widthBoundKeySize, heightBoundKeySize, isCompact ? 68 : 76));

  const result = useMemo(() => safeEvaluate(expression), [expression]);
  const resolvedAmount = result ?? 0;

  useEffect(() => {
    if (!business) return;
    repo.getParties(business.id, 'customer').then(setCustomers).catch(() => setCustomers([]));
  }, [business, repo]);

  const openAction = (mode: ActionMode) => {
    if ((result ?? 0) <= 0) {
      showError('আগে একটি পরিমাণ হিসাব করুন');
      return;
    }
    setActiveAction(mode);
  };

  const handleSubmit = async (input: TransactionInput, successMessage: string) => {
    if (!business) {
      showError('ব্যবসার তথ্য পাওয়া যায়নি');
      return;
    }

    try {
      await repo.createTransaction({ ...input, business_id: business.id });
      setCustomers(await repo.getParties(business.id, 'customer'));
      setActiveAction(null);
      showSuccess(successMessage);
    } catch {
      showError('সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const displayExpression = expression ? formatExpressionForDisplay(expression) : '';
  const displayResult = result == null ? 'ত্রুটি' : toBnDigits(formatResult(Math.abs(resolvedAmount)));

  return (
    <View style={[styles.overlay, { backgroundColor: colors.calculatorBg }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: compactTopPadding, paddingBottom: compactBottomPadding, flexGrow: 1 }}
      >
        <View style={[styles.topBar, { marginBottom: compactTopBarMargin }]}>
          <View style={styles.topSpacer} />
          <Pressable
            style={[styles.closeBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
            onPress={() => {
              setActiveAction(null);
              goBackOr('/(tabs)');
            }}
          >
            <Text style={[styles.closeText, { color: colors.ink }]}>✕</Text>
          </Pressable>
        </View>

        <View style={[styles.displayWrap, { minHeight: compactDisplayMinHeight, marginBottom: compactSectionGap }]}>
          {displayExpression ? <Text style={[styles.expressionText, { color: colors.muted }]}>{displayExpression}</Text> : null}
          <Text style={[styles.displayText, { color: colors.ink, fontSize: compactDisplayFontSize, lineHeight: compactDisplayLineHeight }]}>
            {result == null ? 'ত্রুটি' : `৳${displayResult}`}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.calculatorPanel,
                  borderColor: colors.border,
                  paddingVertical: compactActionPadding,
                  gap: compactActionGap,
                },
              ]}
              onPress={() => openAction(action.key)}
            >
              <AroponIcon
                name={action.icon}
                size={isCompact ? 24 : 28}
                color={action.key === 'expense' ? colors.pay : action.key === 'credit' ? colors.accent : colors.iconPrimary}
              />
              <Text style={[styles.actionLabel, { color: colors.ink, fontSize: compactActionLabelSize, lineHeight: isCompact ? 18 : 22 }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.keypadWrap, { borderTopColor: colors.border, paddingTop: compactKeypadTop }]}>
          {[
            ['C', '(', ')', '÷'],
            ['৭', '৮', '৯', '×'],
            ['৪', '৫', '৬', '-'],
            ['১', '২', '৩', '+'],
            ['±', '০', '.', '='],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.keyRow, { justifyContent: 'space-between' }]}>
              {row.map((key) => {
                const isPrimary = ['÷', '×', '-', '+', '%'].includes(key);
                const isDanger = key === 'C';
                const isEqual = key === '=';

                return (
                  <Pressable
                    key={key}
                    style={[
                      styles.key,
                      { width: keySize, height: keySize, backgroundColor: colors.calculatorKey },
                      isPrimary && styles.keyAccent,
                      isDanger && styles.keyDanger,
                      isEqual && styles.keyEqual,
                    ]}
                    onPress={() => {
                      if (key === 'C') {
                        setExpression('');
                        return;
                      }
                      if (key === '=') {
                        if (result == null) {
                          showError('হিসাবটি সঠিক নয়');
                          return;
                        }
                        setExpression(formatResult(result));
                        return;
                      }
                      if (key === '±') {
                        setExpression((current) => toggleLastNumber(current));
                        return;
                      }
                      setExpression((current) =>
                        appendToken(
                          current,
                          key === '×'
                            ? '*'
                            : key === '÷'
                              ? '/'
                              : key === '০'
                                ? '0'
                                : key === '১'
                                  ? '1'
                                  : key === '২'
                                    ? '2'
                                    : key === '৩'
                                      ? '3'
                                      : key === '৪'
                                        ? '4'
                                        : key === '৫'
                                          ? '5'
                                          : key === '৬'
                                            ? '6'
                                            : key === '৭'
                                              ? '7'
                                              : key === '৮'
                                                ? '8'
                                                : key === '৯'
                                                  ? '9'
                                                  : key,
                        ),
                      );
                    }}
                    onLongPress={() => {
                      if (key === 'C') setExpression('');
                    }}
                  >
                    <Text
                      style={[
                        styles.keyText,
                        { color: colors.calculatorKeyText },
                        isPrimary && styles.keyAccentText,
                        isDanger && styles.keyDangerText,
                        isEqual && styles.keyEqualText,
                      ]}
                    >
                      {key}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {activeAction ? (
        <ActionSheet
          mode={activeAction}
          amount={Math.abs(resolvedAmount)}
          expression={expression}
          customers={customers}
          onClose={() => setActiveAction(null)}
          onSubmit={handleSubmit}
          onCreateCustomer={() => {
            setActiveAction(null);
            router.push({ pathname: '/party/new', params: { type: 'customer' } } as never);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 18, 0.92)',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  topSpacer: { width: 44, height: 44 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  closeText: { color: colors.white, fontSize: 20 },
  displayWrap: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  expressionText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    width: '100%',
  },
  displayText: {
    ...typography.heroAmount,
    color: colors.white,
    textAlign: 'right',
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#111C2C',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.label,
    color: colors.white,
  },
  keypadWrap: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: spacing.sm,
  },
  keyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  key: {
    borderRadius: 999,
    backgroundColor: '#151F30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyAccent: {
    backgroundColor: '#102742',
  },
  keyDanger: {
    backgroundColor: '#2A1620',
  },
  keyEqual: {
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  keyText: {
    ...typography.heroAmount,
    fontSize: 28,
    lineHeight: 34,
    color: colors.white,
  },
  keyAccentText: { color: '#7FC0FF' },
  keyDangerText: { color: '#FF7B8A' },
  keyEqualText: { color: colors.white, fontSize: 34 },
  sheetWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#101828',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  sheetTitle: {
    ...typography.screenTitle,
    color: colors.white,
  },
  sheetSubtitle: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.58)',
  },
  heroAmount: {
    ...typography.heroAmount,
    fontSize: 52,
    lineHeight: 58,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
    borderWidth: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.58)',
  },
  infoValue: {
    ...typography.sectionTitle,
    color: colors.white,
  },
  sectionLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.72)',
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  partyName: {
    ...typography.sectionTitle,
    color: colors.white,
  },
  partyMeta: {
    ...typography.bodySm,
    color: colors.amber,
  },
  changeCustomerText: {
    ...typography.caption,
    color: '#7FC0FF',
  },
  partyChips: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  createPartyChip: {
    borderWidth: 1,
    borderColor: 'rgba(127,192,255,0.45)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(16,39,66,0.6)',
  },
  createPartyText: {
    ...typography.bodySm,
    color: '#7FC0FF',
  },
  partyChip: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  partyChipActive: {
    backgroundColor: `${colors.brand}22`,
    borderWidth: 1,
    borderColor: `${colors.brand}66`,
  },
  partyChipText: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.72)',
  },
  partyChipTextActive: {
    color: '#7FC0FF',
  },
  moreCustomersChip: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(127,192,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(127,192,255,0.28)',
  },
  moreCustomersText: {
    ...typography.bodySm,
    color: '#7FC0FF',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: `${colors.brand}22`,
    borderWidth: 1,
    borderColor: `${colors.brand}66`,
  },
  categoryText: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.72)',
  },
  categoryTextActive: {
    color: '#7FC0FF',
  },
  noteInput: {
    backgroundColor: '#162133',
    color: colors.white,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  confirmButton: {
    marginTop: spacing.xs,
  },
  pickerWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  pickerSheet: {
    backgroundColor: '#0E1726',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '72%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerCloseBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pickerCloseText: {
    ...typography.bodySm,
    color: '#7FC0FF',
  },
  pickerSearchInput: {
    backgroundColor: '#162133',
    color: colors.white,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  createCustomerRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(16,39,66,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(127,192,255,0.22)',
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#162133',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  customerRowActive: {
    borderWidth: 1,
    borderColor: `${colors.brand}66`,
    backgroundColor: `${colors.brand}18`,
  },
  customerRowMain: {
    flex: 1,
    gap: 2,
  },
  customerRowName: {
    ...typography.label,
    color: colors.white,
  },
  customerRowNameActive: {
    color: '#7FC0FF',
  },
  customerRowMeta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.54)',
  },
  customerRowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  customerRowBalance: {
    ...typography.label,
    color: colors.amber,
  },
  customerRowBalanceActive: {
    color: '#FFD15C',
  },
  customerRowBalanceLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyPickerState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyPickerTitle: {
    ...typography.label,
    color: colors.white,
  },
  emptyPickerText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.58)',
    textAlign: 'center',
  },
});
