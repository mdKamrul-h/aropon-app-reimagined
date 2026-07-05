import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HisabDarkScreen, useHisabScreenStyles } from '@/components/accounting/HisabDarkScreen';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useAppTheme } from '@/context/ThemeContext';
import type { Transaction } from '@/types/schema';
import { typography } from '@/constants/theme';
import { toBnDigits } from '@/utils/bn-numerals';

export default function KorochKhataScreen() {
  const { business } = useAuth();
  const { repo } = useRepository();
  const { colors } = useAppTheme();
  const hisabStyles = useHisabScreenStyles();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const txns = await repo.getTransactions(business.id);
    setExpenses(txns.filter((tx) => tx.type === 'expense'));
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalExpense = useMemo(() => expenses.reduce((sum, tx) => sum + tx.amount, 0), [expenses]);
  const todayExpense = useMemo(
    () => expenses.filter((tx) => tx.transaction_date === new Date().toISOString().slice(0, 10)).reduce((sum, tx) => sum + tx.amount, 0),
    [expenses],
  );

  return (
    <HisabDarkScreen title="খরচ খাতা" subtitle="দোকানের সব খরচ আলাদা করে দেখুন">
      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          <View style={hisabStyles.statGrid}>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>আজকের খরচ</Text>
              <TakaAmount amount={todayExpense} color={colors.pay} size="card" />
            </View>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>মোট খরচ</Text>
              <TakaAmount amount={totalExpense} color={colors.pay} size="card" />
              <Text style={hisabStyles.statHint}>{toBnDigits(expenses.length)} টি খরচ এন্ট্রি</Text>
            </View>
          </View>

          <View style={hisabStyles.listCard}>
            {expenses.map((tx, index) => (
              <View key={tx.id} style={[hisabStyles.row, index === expenses.length - 1 && styles.lastRow]}>
                <View style={styles.marker} />
                <View style={{ flex: 1 }}>
                  <Text style={hisabStyles.rowTitle}>{tx.note ?? 'খরচ'}</Text>
                  <Text style={hisabStyles.rowMeta}>{tx.transaction_date} · {tx.payment_method}</Text>
                </View>
                <TakaAmount amount={tx.amount} color={colors.pay} size="sm" />
              </View>
            ))}
          </View>
        </>
      )}
    </HisabDarkScreen>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D32F2F',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
