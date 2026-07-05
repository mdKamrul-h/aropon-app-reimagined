import { useCallback, useEffect, useMemo, useState } from 'react';

import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

import { EmptyState } from '@/components/ui/EmptyState';

import { ScreenHeader } from '@/components/ui/ScreenHeader';

import { ScreenLoader } from '@/components/ui/ScreenLoader';

import { SurfaceCard } from '@/components/ui/SurfaceCard';

import { TabScreenShell } from '@/components/ui/TabScreenShell';

import { TakaAmount } from '@/components/ui/TakaAmount';

import { AroponIcon } from '@/components/icons/AroponIcon';

import { useAuth } from '@/context/AuthContext';

import { useRepository } from '@/context/RepositoryContext';

import { useUiPreferences } from '@/context/UiPreferencesContext';

import { PremiumReminderActions } from '@/components/premium/PremiumReminderActions';

import type { Party, Transaction } from '@/types/schema';

import { fonts, radius, spacing, typography } from '@/constants/theme';

import { TRANSACTION_TYPE_LABELS } from '@/constants/actions';



function computeRunningBalances(txns: Transaction[]) {

  const sorted = [...txns].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));

  let running = 0;

  const rows = sorted.map((tx) => {

    let delta = 0;

    if (tx.type === 'sale' && tx.is_credit) delta = tx.amount;

    if (tx.type === 'purchase' && tx.is_credit) delta = -tx.amount;

    if (tx.type === 'payment_in') delta = -tx.amount;

    if (tx.type === 'payment_out') delta = tx.amount;

    running += delta;

    return { tx, running };

  });

  return rows.reverse();

}



export default function PartyLedgerScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { business } = useAuth();

  const { repo } = useRepository();

  const { resolvedTheme: t } = useUiPreferences();

  const [party, setParty] = useState<Party | null>(null);

  const [txns, setTxns] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);



  const load = useCallback(async () => {

    if (!id || !business) return;

    setLoading(true);

    setParty(await repo.getParty(String(id)));

    setTxns(await repo.getTransactions(business.id, String(id)));

    setLoading(false);

  }, [business, id, repo]);



  useEffect(() => {

    void load();

  }, [load]);



  const ledgerRows = useMemo(() => computeRunningBalances(txns), [txns]);



  if (loading) {

    return (

      <TabScreenShell>

        <ScreenHeader title="খাতা" backFallback="/khata" />

        <ScreenLoader />

      </TabScreenShell>

    );

  }



  if (!party || !business) return null;



  const balanceColor = party.balance > 0 ? t.receive : party.balance < 0 ? t.pay : t.muted;



  return (

    <TabScreenShell>

      <ScreenHeader

        title={party.name}

        backFallback="/khata"

        right={

          party.phone ? (

            <Pressable onPress={() => Linking.openURL(`tel:${party.phone}`)} style={[styles.callBtn, { backgroundColor: t.cardTint }]}>

              <AroponIcon name="mobilepay" size={22} color={t.brand} />

            </Pressable>

          ) : undefined

        }

      />



      <SurfaceCard style={styles.balanceCard}>

        <Text style={[styles.balanceLabel, { color: t.mutedDark }]}>

          {party.balance >= 0 ? 'আপনি পাবেন' : 'আপনি দিবেন'}

        </Text>

        <TakaAmount amount={Math.abs(party.balance)} color={balanceColor} size="lg" />

        <PremiumReminderActions

          phone={party.phone}

          partyName={party.name}

          balance={party.balance}

          shopName={business.name}

          template={business.reminder_sms_template}

        />

      </SurfaceCard>



      {txns.length === 0 ? (

        <EmptyState title="কোনো লেনদেন নেই" icon="book" />

      ) : (

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 }}>

          {ledgerRows.map(({ tx, running }) => {

            const txColor = tx.type === 'sale' || tx.type === 'payment_in' ? t.receive : t.pay;

            return (

              <SurfaceCard key={tx.id} style={styles.txRow}>

                <View style={[styles.dot, { backgroundColor: txColor }]} />

                <View style={{ flex: 1 }}>

                  <Text style={[styles.txNote, { color: t.ink }]}>

                    {tx.note ?? TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}

                  </Text>

                  <Text style={[styles.txMeta, { color: t.muted }]}>

                    {tx.transaction_date} · {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}

                  </Text>

                </View>

                <View style={{ alignItems: 'flex-end', gap: 2 }}>

                  <TakaAmount amount={tx.amount} color={txColor} />

                  <TakaAmount amount={running} color={t.muted} size="sm" showSign />

                </View>

              </SurfaceCard>

            );

          })}

        </ScrollView>

      )}



      <View

        style={[

          styles.actions,

          {

            paddingBottom: insets.bottom + 12,

            backgroundColor: t.card,

            borderTopColor: t.border,

          },

        ]}

      >

        <Button

          label="দিলাম −"

          variant="danger"

          onPress={() => router.push({ pathname: '/transaction/pay', params: { partyId: party.id } } as never)}

          style={styles.actionBtn}

        />

        <Button

          label="পেলাম +"

          onPress={() =>

            router.push({ pathname: '/transaction/receive', params: { partyId: party.id } } as never)

          }

          style={styles.actionBtn}

        />

      </View>

    </TabScreenShell>

  );

}



const styles = StyleSheet.create({

  callBtn: {

    padding: spacing.xs,

    borderRadius: 20,

    width: 36,

    height: 36,

    alignItems: 'center',

    justifyContent: 'center',

  },

  balanceCard: {

    margin: spacing.lg,

    gap: spacing.sm,

  },

  balanceLabel: { ...typography.label },

  txRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.md,

  },

  dot: { width: 10, height: 10, borderRadius: 5 },

  txNote: { ...typography.body, fontFamily: fonts.bengaliSemiBold },

  txMeta: { ...typography.caption },

  actions: {

    position: 'absolute',

    left: spacing.lg,

    right: spacing.lg,

    bottom: 0,

    flexDirection: 'row',

    gap: spacing.md,

    paddingTop: spacing.sm,

    borderTopWidth: 1,

  },

  actionBtn: { flex: 1 },

});

