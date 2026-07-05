import { Pressable, View, Text, StyleSheet } from 'react-native';
import { AroponIcon } from '@/components/icons/AroponIcon';
import type { IconName } from '@/components/icons/aroponIconData';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import type { Transaction } from '@/types/schema';
import { paymentMethodLabel } from '@/constants/paymentMethods';
import { TRANSACTION_TYPE_LABELS } from '@/constants/actions';
import { fonts, spacing, typography } from '@/constants/theme';

const TYPE_ICONS: Record<string, IconName> = {
  sale: 'orders',
  purchase: 'grocery',
  payment_in: 'income',
  payment_out: 'expense',
  expense: 'expense',
};

/** Whether this transaction moved real cash (vs. a credit/বাকি entry that
 * only changes a party balance, not the till). Used for both the row
 * color and the running cash-balance calculation. */
export function isCashMovement(t: Transaction): boolean {
  if (t.type === 'sale' || t.type === 'purchase') return !t.is_credit;
  return true;
}

export function cashDelta(t: Transaction): number {
  if (!isCashMovement(t)) return 0;
  const inflow = t.type === 'sale' || t.type === 'payment_in';
  return inflow ? t.amount : -t.amount;
}

interface LedgerRowProps {
  transaction: Transaction;
  runningBalance?: number;
  onPress?: () => void;
}

export function LedgerRow({ transaction, runningBalance, onPress }: LedgerRowProps) {
  const { resolvedTheme: theme } = useUiPreferences();
  const t = transaction;
  const inflow = t.type === 'sale' || t.type === 'payment_in';

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={[styles.row, { borderBottomColor: theme.border }]} {...(onPress ? { onPress } : {})}>
      <AroponIcon name={TYPE_ICONS[t.type] ?? 'book'} size={28} />
      <View style={styles.body}>
        <Text style={[styles.note, { color: theme.ink }]}>
          {t.note ?? TRANSACTION_TYPE_LABELS[t.type] ?? t.type}
          {t.is_credit ? ' · বাকি' : ''}
        </Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {t.transaction_date} · {paymentMethodLabel(t.payment_method)}
        </Text>
      </View>
      <View style={styles.amounts}>
        <TakaAmount amount={t.amount} color={inflow ? theme.receive : theme.pay} showSign />
        {runningBalance !== undefined ? (
          <TakaAmount amount={runningBalance} color={theme.muted} size="sm" showSign />
        ) : null}
      </View>
    </Wrapper>
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
