import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HisabDarkScreen, useHisabScreenStyles } from '@/components/accounting/HisabDarkScreen';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useAppTheme } from '@/context/ThemeContext';
import type { Party, PartyType, Transaction } from '@/types/schema';
import { typography } from '@/constants/theme';
import { partyTypeLabel } from '@/constants/partyLabels';
import { toBnDigits } from '@/utils/bn-numerals';

export default function BakiKhataScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { colors, isDark } = useAppTheme();
  const hisabStyles = useHisabScreenStyles();
  const [segment, setSegment] = useState<PartyType>('customer');
  const [parties, setParties] = useState<Party[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const [allParties, allTxns] = await Promise.all([
      repo.getParties(business.id),
      repo.getTransactions(business.id),
    ]);
    setParties(allParties);
    setTxns(allTxns);
    setLoading(false);
  }, [business, repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleParties = useMemo(
    () =>
      parties
        .filter((party) => party.type === segment)
        .filter((party) => segment === 'customer' ? party.balance > 0 : party.balance < 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [parties, segment],
  );

  const totalDue = useMemo(
    () => visibleParties.reduce((sum, party) => sum + Math.abs(party.balance), 0),
    [visibleParties],
  );
  const todayPayments = useMemo(
    () =>
      txns
        .filter((tx) => tx.transaction_date === new Date().toISOString().slice(0, 10))
        .filter((tx) => segment === 'customer' ? tx.type === 'payment_in' : tx.type === 'payment_out')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [segment, txns],
  );

  return (
    <HisabDarkScreen title="বাকি খাতা" subtitle="কার কাছে কত বাকি, এক নজরে">
      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          <View style={styles.segmentRow}>
            {(['customer', 'dealer'] as PartyType[]).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: isDark ? colors.card : colors.cardAlt,
                    borderColor: colors.border,
                  },
                  segment === type && {
                    backgroundColor: isDark ? colors.successBg : colors.surfaceAlt,
                    borderColor: colors.brand,
                  },
                ]}
                onPress={() => setSegment(type)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: segment === type ? colors.brand : colors.mutedDark },
                  ]}
                >
                  {partyTypeLabel(type)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={hisabStyles.statGrid}>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>{segment === 'customer' ? 'মোট পাবেন' : 'মোট দিবেন'}</Text>
              <TakaAmount amount={totalDue} color={segment === 'customer' ? colors.receive : colors.pay} size="card" />
            </View>
            <View style={hisabStyles.statCard}>
              <Text style={hisabStyles.statLabel}>{segment === 'customer' ? 'আজ আদায়' : 'আজ পরিশোধ'}</Text>
              <TakaAmount amount={todayPayments} color={segment === 'customer' ? colors.receive : colors.amber} size="card" />
              <Text style={hisabStyles.statHint}>{toBnDigits(visibleParties.length)} জন পার্টি</Text>
            </View>
          </View>

          <View style={hisabStyles.listCard}>
            {visibleParties.map((party, index) => (
              <Pressable
                key={party.id}
                style={[hisabStyles.row, index === visibleParties.length - 1 && styles.lastRow]}
                onPress={() => router.push({ pathname: '/party/[id]', params: { id: party.id } })}
              >
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor:
                        segment === 'customer'
                          ? isDark
                            ? colors.successBg
                            : '#EDF9F0'
                          : isDark
                            ? colors.errorBg
                            : '#FFF1F1',
                    },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: segment === 'customer' ? colors.receive : colors.pay }]}>{party.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={hisabStyles.rowTitle}>{party.name}</Text>
                  <Text style={hisabStyles.rowMeta}>{party.last_activity_at?.slice(0, 10) ?? 'কোনো সাম্প্রতিক লেনদেন নেই'}</Text>
                </View>
                <TakaAmount amount={Math.abs(party.balance)} color={segment === 'customer' ? colors.receive : colors.pay} size="sm" />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </HisabDarkScreen>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentText: {
    ...typography.label,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.sectionTitle,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
