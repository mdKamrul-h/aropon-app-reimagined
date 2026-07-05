import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HisabDarkScreen, useHisabScreenStyles } from '@/components/accounting/HisabDarkScreen';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useAppTheme } from '@/context/ThemeContext';
import type { Transaction } from '@/types/schema';
import { spacing, typography } from '@/constants/theme';

const TYPE_LABELS: Record<string, string> = {
  sale: 'বিক্রি',
  purchase: 'ক্রয়',
  payment_in: 'আদায়',
  payment_out: 'পরিশোধ',
  expense: 'খরচ',
};

export default function HisabKhataScreen() {
  const { business } = useAuth();
  const { repo } = useRepository();
  const { colors } = useAppTheme();
  const hisabStyles = useHisabScreenStyles();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setTxns(await repo.getTransactions(business.id));
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const income = useMemo(
    () => txns.filter((t) => t.type === 'sale' || t.type === 'payment_in').reduce((sum, t) => sum + t.amount, 0),
    [txns],
  );
  const expense = useMemo(
    () => txns.filter((t) => t.type === 'purchase' || t.type === 'payment_out' || t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [txns],
  );

  let running = 0;

  return (
    <HisabDarkScreen title="খাতা" subtitle="সব লেনদেন, ক্যাশবুক আর রানিং ব্যালান্স">
      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          <View style={hisabStyles.statGrid}>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>মোট জমা</Text>
              <TakaAmount amount={income} color={colors.receive} size="card" />
            </View>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>মোট খরচ</Text>
              <TakaAmount amount={expense} color={colors.pay} size="card" />
            </View>
          </View>

          <View style={hisabStyles.listCard}>
            {txns.map((tx, index) => {
              const delta = tx.type === 'sale' || tx.type === 'payment_in' ? tx.amount : -tx.amount;
              running += delta;
              return (
                <View key={tx.id} style={[hisabStyles.row, index === txns.length - 1 && styles.lastRow]}>
                  <View style={[styles.dot, { backgroundColor: delta >= 0 ? colors.receive : colors.pay }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={hisabStyles.rowTitle}>{tx.note ?? TYPE_LABELS[tx.type] ?? tx.type}</Text>
                    <Text style={hisabStyles.rowMeta}>{tx.transaction_date} · {TYPE_LABELS[tx.type] ?? tx.type}</Text>
                  </View>
                  <View style={styles.amountCol}>
                    <TakaAmount amount={tx.amount} color={delta >= 0 ? colors.receive : colors.pay} size="sm" showSign />
                    <Text style={[styles.runningText, { color: colors.muted }]}>
                      রানিং ৳ {tx.running_balance != null ? tx.running_balance : Math.abs(running)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </HisabDarkScreen>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  runningText: {
    ...typography.caption,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
