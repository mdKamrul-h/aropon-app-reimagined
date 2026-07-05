import { View, Text, StyleSheet } from 'react-native';
import { AroponIcon } from '@/components/icons/AroponIcon';
import type { IconName } from '@/components/icons/aroponIconData';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { Transaction } from '@/types/schema';
import { paymentMethodLabel } from '@/constants/paymentMethods';
import { fonts, spacing, typography } from '@/constants/theme';

const TYPE_LABELS: Record<string, string> = {
  sale: 'বিক্রি',
  purchase: 'ক্রয়',
  payment_in: 'আদায়',
  payment_out: 'পরিশোধ',
  expense: 'খরচ',
};

const TYPE_ICONS: Record<string, IconName> = {
  sale: 'orders',
  purchase: 'grocery',
  payment_in: 'income',
  payment_out: 'expense',
  expense: 'expense',
};

interface LedgerRowProps {
  transaction: Transaction;
  runningBalance: number;
}

export function LedgerRow({ transaction, runningBalance }: LedgerRowProps) {
  const { resolvedTheme: theme } = useUiPreferences();
  const t = transaction;
  const delta = t.type === 'sale' || t.type === 'payment_in' ? t.amount : -t.amount;
  const positive = delta >= 0;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <AroponIcon name={TYPE_ICONS[t.type] ?? 'book'} size={28} />
      <View style={styles.body}>
        <Text style={[styles.note, { color: theme.ink }]}>
          {t.note ?? TYPE_LABELS[t.type] ?? t.type}
        </Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {t.transaction_date} · {paymentMethodLabel(t.payment_method)}
        </Text>
      </View>
      <View style={styles.amounts}>
        <TakaAmount amount={t.amount} color={positive ? theme.receive : theme.pay} showSign />
        <TakaAmount amount={Math.abs(runningBalance)} color={theme.muted} size="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  body: { flex: 1, gap: 2 },
  note: { ...typography.bodySm, fontFamily: fonts.bengaliSemiBold },
  meta: { ...typography.caption },
  amounts: { alignItems: 'flex-end', gap: 2 },
});
