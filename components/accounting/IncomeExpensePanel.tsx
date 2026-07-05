import { View, Text, StyleSheet } from 'react-native';

import { AroponIcon } from '@/components/icons/AroponIcon';

import type { IconName } from '@/components/icons/aroponIconData';

import { Card } from '@/components/ui/Card';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

import { TakaAmount } from '@/components/ui/TakaAmount';

import { useUiPreferences } from '@/context/UiPreferencesContext';

import { paymentMethodLabel } from '@/constants/paymentMethods';

import type { Party, Transaction } from '@/types/schema';

import { toBnDigits } from '@/utils/bn-numerals';

import { fonts, radius, spacing, typography } from '@/constants/theme';



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



interface IncomeExpensePanelProps {

  transactions: Transaction[];

  parties: Party[];

  income: number;

  expense: number;

}



function partyName(parties: Party[], partyId: string | null | undefined): string | null {

  if (!partyId) return null;

  return parties.find((p) => p.id === partyId)?.name ?? null;

}



function TxRow({ tx, parties }: { tx: Transaction; parties: Party[] }) {

  const { resolvedTheme: theme } = useUiPreferences();

  const positive = tx.type === 'sale' || tx.type === 'payment_in';

  const name = partyName(parties, tx.party_id);

  const label = tx.note ?? TYPE_LABELS[tx.type] ?? tx.type;



  return (

    <View style={[styles.txRow, { borderTopColor: theme.border }]}>

      <AroponIcon name={TYPE_ICONS[tx.type] ?? 'book'} size={26} />

      <View style={styles.txBody}>

        <Text style={[styles.txNote, { color: theme.ink }]} numberOfLines={1}>

          {name ? `${name} · ${label}` : label}

        </Text>

        <Text style={[styles.txMeta, { color: theme.muted }]}>

          {tx.transaction_date} · {paymentMethodLabel(tx.payment_method)}

        </Text>

      </View>

      <TakaAmount amount={tx.amount} color={positive ? theme.receive : theme.pay} size="sm" />

    </View>

  );

}



function PlBar({ income, expense }: { income: number; expense: number }) {

  const { resolvedTheme: theme } = useUiPreferences();

  const total = income + expense;

  const incomePct = total > 0 ? (income / total) * 100 : 50;

  const expensePct = total > 0 ? (expense / total) * 100 : 50;



  return (
    <SurfaceCard style={styles.plWrap} padded={false}>
      <View style={styles.plLabels}>

        <Text style={[styles.plLabel, { color: theme.mutedDark }]}>আয় vs ব্যয়</Text>

        <Text style={[styles.plNet, { color: theme.brand }]}>

          নিট {income >= expense ? '+' : '−'}৳{toBnDigits(Math.abs(income - expense))}

        </Text>

      </View>

      <View style={[styles.plBar, { backgroundColor: theme.surface }]}>

        <View style={[styles.plIncome, { flex: incomePct, backgroundColor: theme.receive }]} />

        <View style={[styles.plExpense, { flex: expensePct, backgroundColor: theme.pay }]} />

      </View>

      <View style={styles.plLegend}>

        <Text style={[styles.plLegendText, { color: theme.receive }]}>আয়</Text>

        <Text style={[styles.plLegendText, { color: theme.pay }]}>ব্যয়</Text>

      </View>
    </SurfaceCard>
  );
}



export function IncomeExpensePanel({

  transactions,

  parties,

  income,

  expense,

}: IncomeExpensePanelProps) {

  const { resolvedTheme: theme } = useUiPreferences();



  const incomeTxns = transactions.filter((t) => t.type === 'sale' || t.type === 'payment_in');

  const expenseTxns = transactions.filter((t) =>

    ['expense', 'purchase', 'payment_out'].includes(t.type),

  );



  const salesTotal = incomeTxns.filter((t) => t.type === 'sale').reduce((s, t) => s + t.amount, 0);

  const collectionsTotal = incomeTxns

    .filter((t) => t.type === 'payment_in')

    .reduce((s, t) => s + t.amount, 0);

  const salesCount = incomeTxns.filter((t) => t.type === 'sale').length;

  const collectionsCount = incomeTxns.filter((t) => t.type === 'payment_in').length;



  const expenseByCategory = new Map<string, number>();

  for (const t of expenseTxns.filter((tx) => tx.type === 'expense')) {

    const cat = t.note?.trim() || 'অন্যান্য';

    expenseByCategory.set(cat, (expenseByCategory.get(cat) ?? 0) + t.amount);

  }



  const purchaseTotal = expenseTxns

    .filter((t) => t.type === 'purchase')

    .reduce((s, t) => s + t.amount, 0);

  const payoutTotal = expenseTxns

    .filter((t) => t.type === 'payment_out')

    .reduce((s, t) => s + t.amount, 0);



  return (

    <View style={styles.wrap}>

      <PlBar income={income} expense={expense} />



      <Card style={styles.sectionCard}>

        <Text style={[styles.sectionTitle, { color: theme.ink }]}>আয়</Text>

        <View style={styles.subtotalRow}>

          <View style={[styles.subtotalChip, { backgroundColor: theme.cardTint }]}>

            <Text style={[styles.subtotalLabel, { color: theme.muted }]}>

              বিক্রি ({toBnDigits(salesCount)})

            </Text>

            <TakaAmount amount={salesTotal} color={theme.receive} size="sm" />

          </View>

          <View style={[styles.subtotalChip, { backgroundColor: theme.cardTint }]}>

            <Text style={[styles.subtotalLabel, { color: theme.muted }]}>

              আদায় ({toBnDigits(collectionsCount)})

            </Text>

            <TakaAmount amount={collectionsTotal} color={theme.receive} size="sm" />

          </View>

        </View>

        {incomeTxns.length === 0 ? (

          <Text style={[styles.empty, { color: theme.muted }]}>কোনো আয় নেই</Text>

        ) : (

          incomeTxns.map((t) => <TxRow key={t.id} tx={t} parties={parties} />)

        )}

      </Card>



      <Card style={styles.sectionCard}>

        <Text style={[styles.sectionTitle, { color: theme.ink }]}>ব্যয়</Text>

        <View style={styles.subtotalRow}>

          {purchaseTotal > 0 ? (

            <View style={[styles.subtotalChip, { backgroundColor: theme.cardTint }]}>

              <Text style={[styles.subtotalLabel, { color: theme.muted }]}>ক্রয়</Text>

              <TakaAmount amount={purchaseTotal} color={theme.pay} size="sm" />

            </View>

          ) : null}

          {payoutTotal > 0 ? (

            <View style={[styles.subtotalChip, { backgroundColor: theme.cardTint }]}>

              <Text style={[styles.subtotalLabel, { color: theme.muted }]}>পরিশোধ</Text>

              <TakaAmount amount={payoutTotal} color={theme.pay} size="sm" />

            </View>

          ) : null}

          {[...expenseByCategory.entries()].slice(0, 3).map(([cat, amt]) => (

            <View key={cat} style={[styles.subtotalChip, { backgroundColor: theme.cardTint }]}>

              <Text style={[styles.subtotalLabel, { color: theme.muted }]} numberOfLines={1}>

                {cat}

              </Text>

              <TakaAmount amount={amt} color={theme.pay} size="sm" />

            </View>

          ))}

        </View>

        {expenseTxns.length === 0 ? (

          <Text style={[styles.empty, { color: theme.muted }]}>কোনো ব্যয় নেই</Text>

        ) : (

          expenseTxns.map((t) => <TxRow key={t.id} tx={t} parties={parties} />)

        )}

      </Card>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { gap: spacing.md },

  plWrap: {
    gap: spacing.sm,
    padding: spacing.lg,
  },

  plLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  plLabel: { ...typography.label },

  plNet: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },

  plBar: {

    flexDirection: 'row',

    height: 10,

    borderRadius: radius.pill,

    overflow: 'hidden',

  },

  plIncome: {},

  plExpense: {},

  plLegend: { flexDirection: 'row', justifyContent: 'space-between' },

  plLegendText: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },

  sectionCard: { gap: spacing.sm },

  sectionTitle: { ...typography.sectionTitle },

  subtotalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  subtotalChip: {

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    borderRadius: radius.md,

    gap: 2,

    minWidth: '45%',

    flexGrow: 1,

  },

  subtotalLabel: { ...typography.caption },

  empty: { ...typography.bodySm, textAlign: 'center', paddingVertical: spacing.md },

  txRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.md,

    paddingVertical: spacing.sm,

    borderTopWidth: 1,

  },

  txBody: { flex: 1, gap: 2 },

  txNote: { ...typography.bodySm, fontFamily: fonts.bengaliSemiBold },

  txMeta: { ...typography.caption },

});

