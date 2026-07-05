import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { HisabDarkScreen, useHisabScreenStyles } from '@/components/accounting/HisabDarkScreen';
import { DayFilterChips, DaySummaryCards, type DayFilter } from '@/components/accounting/DayFilterChips';
import { LedgerRow, cashDelta } from '@/components/accounting/LedgerRow';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import type { Transaction, TransactionType } from '@/types/schema';
import { spacing, radius, typography } from '@/constants/theme';
import { todayISO } from '@/utils/bn-numerals';

type TypeFilter = 'all' | TransactionType;

const TYPE_CHIPS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'sale', label: 'বিক্রি' },
  { key: 'purchase', label: 'ক্রয়' },
  { key: 'payment_in', label: 'আদায়' },
  { key: 'payment_out', label: 'পরিশোধ' },
  { key: 'expense', label: 'খরচ' },
];

function isYesterday(dateStr: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr === d.toISOString().slice(0, 10);
}

function isThisMonth(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(`${dateStr}T12:00:00`);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
}

export default function LedgerScreen() {
  const { business } = useAuth();
  const { repo } = useRepository();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const hisabStyles = useHisabScreenStyles();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setTxns(await repo.getTransactions(business.id));
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayFiltered = useMemo(() => {
    const today = todayISO();
    return txns.filter((t) => {
      if (dayFilter === 'today') return t.transaction_date === today;
      if (dayFilter === 'yesterday') return isYesterday(t.transaction_date);
      if (dayFilter === 'month') return isThisMonth(t.transaction_date);
      return true;
    });
  }, [txns, dayFilter]);

  // Running cash balance: computed chronologically (oldest first), then
  // reversed for display (newest first). Credit sales/purchases don't
  // move the running cash total — only real cash movements do.
  const withRunning = useMemo(() => {
    const chrono = [...dayFiltered].sort((a, b) => a.created_at.localeCompare(b.created_at));
    let running = 0;
    const runningById = new Map<string, number>();
    for (const t of chrono) {
      running += cashDelta(t);
      runningById.set(t.id, running);
    }
    return dayFiltered
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((t) => ({ tx: t, running: runningById.get(t.id) ?? 0 }));
  }, [dayFiltered]);

  const visible = useMemo(
    () => (typeFilter === 'all' ? withRunning : withRunning.filter((r) => r.tx.type === typeFilter)),
    [withRunning, typeFilter],
  );

  const cashIn = useMemo(
    () => dayFiltered.reduce((sum, t) => sum + Math.max(0, cashDelta(t)), 0),
    [dayFiltered],
  );
  const cashOut = useMemo(
    () => dayFiltered.reduce((sum, t) => sum + Math.max(0, -cashDelta(t)), 0),
    [dayFiltered],
  );

  const handleDelete = useCallback(
    (tx: Transaction) => {
      Alert.alert('এন্ট্রি মুছবেন?', 'এই লেনদেনটি মুছে ফেলা হবে এবং সংশ্লিষ্ট হিসাব ঠিক করা হবে।', [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'মুছুন',
          style: 'destructive',
          onPress: async () => {
            try {
              await repo.deleteTransaction(tx.id);
              showSuccess('এন্ট্রি মুছে ফেলা হয়েছে');
              void load();
            } catch {
              showError('মুছতে সমস্যা হয়েছে');
            }
          },
        },
      ]);
    },
    [repo, showSuccess, showError, load],
  );

  return (
    <HisabDarkScreen title="হিসাব খাতা" subtitle="সব লেনদেন, ক্যাশবুক আর রানিং ব্যালান্স">
      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          <DayFilterChips value={dayFilter} onChange={setDayFilter} />
          <DaySummaryCards income={cashIn} expense={cashOut} />

          <View style={styles.typeRow}>
            {TYPE_CHIPS.map((c) => {
              const active = typeFilter === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setTypeFilter(c.key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: active ? colors.brand : colors.card,
                      borderColor: active ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.typeChipText, { color: active ? colors.white : colors.inkSecondary }]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <EmptyState title="এই ফিল্টারে কোনো লেনদেন নেই" />
          ) : (
            <View style={hisabStyles.listCard}>
              {visible.map(({ tx, running }, index) => (
                <View
                  key={tx.id}
                  style={[styles.rowWrap, index === visible.length - 1 && styles.lastRowWrap]}
                >
                  <LedgerRow transaction={tx} runningBalance={running} />
                  <Pressable
                    onPress={() => handleDelete(tx)}
                    style={styles.deleteBtn}
                    accessibilityLabel="এন্ট্রি মুছুন"
                  >
                    <Text style={[styles.deleteGlyph, { color: colors.muted }]}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </HisabDarkScreen>
  );
}

const styles = StyleSheet.create({
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  typeChipText: { ...typography.caption },
  rowWrap: { position: 'relative', paddingRight: 24 },
  lastRowWrap: { borderBottomWidth: 0 },
  deleteBtn: { position: 'absolute', right: 0, top: '50%', marginTop: -12, padding: spacing.xs },
  deleteGlyph: { fontSize: 16, lineHeight: 16 },
});
