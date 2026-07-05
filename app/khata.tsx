import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Chip } from '@/components/ui/Chip';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { SearchField } from '@/components/ui/SearchField';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TakaAmount } from '@/components/ui/TakaAmount';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { PremiumReminderActions } from '@/components/premium/PremiumReminderActions';
import { PARTY_TYPE_LABELS, partyTypeEmptyTitle } from '@/constants/partyLabels';
import type { Party, PartyType, Transaction } from '@/types/schema';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { toBnDigits, todayISO } from '@/utils/bn-numerals';

function matchesQuery(name: string, query: string) {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export default function KhataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();
  const [segment, setSegment] = useState<PartyType>('customer');
  const [parties, setParties] = useState<Party[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [query, setQuery] = useState('');
  const [duesOnly, setDuesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setError('');
    try {
      const [partyList, txList] = await Promise.all([
        repo.getParties(business.id, segment),
        repo.getTransactions(business.id),
      ]);
      setParties(partyList);
      setTxns(txList);
    } catch {
      setError('ডেটা লোড করা যায়নি');
    }
    setLoading(false);
  }, [business, repo, segment]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!business) return null;

  const dueDirectionMatch = (p: Party) => (segment === 'customer' ? p.balance > 0 : p.balance < 0);

  const totalDue = parties.filter(dueDirectionMatch).reduce((s, p) => s + Math.abs(p.balance), 0);

  const todayMovement = useMemo(() => {
    const today = todayISO();
    const wantType = segment === 'customer' ? 'payment_in' : 'payment_out';
    return txns
      .filter((tx) => tx.transaction_date === today && tx.type === wantType)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [txns, segment]);

  const byDues = duesOnly ? parties.filter(dueDirectionMatch) : parties;
  const filtered = byDues.filter((p) => matchesQuery(p.name, query));
  const noResults = query.trim().length > 0 && filtered.length === 0;

  return (
    <TabScreenShell withNav tabActive="home">
      <ScreenHeader title="খাতা" backFallback="/(tabs)">
        <View style={styles.segments}>
          <Chip
            options={[
              { key: 'customer', label: PARTY_TYPE_LABELS.customer },
              { key: 'dealer', label: PARTY_TYPE_LABELS.dealer },
            ]}
            value={segment}
            onChange={setSegment}
          />
          <AnimatedPressable
            style={styles.addPill}
            onPress={() => router.push({ pathname: '/party/new', params: { type: segment } })}
            haptic="light"
          >
            <Text style={styles.addPillText}>+ নতুন</Text>
          </AnimatedPressable>
        </View>
      </ScreenHeader>

      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: t.receiveTint }]}>
          <Text style={[styles.statLabel, { color: t.receive }]}>
            {segment === 'customer' ? 'মোট পাবেন' : 'মোট দিবেন'}
          </Text>
          <TakaAmount amount={totalDue} color={t.receive} size="sm" />
        </View>
        <View style={[styles.statCard, { backgroundColor: t.surfaceMuted }]}>
          <Text style={[styles.statLabel, { color: t.mutedDark }]}>
            {segment === 'customer' ? 'আজ আদায়' : 'আজ পরিশোধ'}
          </Text>
          <TakaAmount amount={todayMovement} color={t.brand} size="sm" />
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={{ flex: 1 }}>
          <SearchField value={query} onChangeText={setQuery} noResults={noResults} />
        </View>
        <Pressable
          onPress={() => setDuesOnly((v) => !v)}
          style={[
            styles.duesChip,
            {
              backgroundColor: duesOnly ? t.brand : t.card,
              borderColor: duesOnly ? t.brand : t.border,
            },
          ]}
        >
          <Text style={{ color: duesOnly ? '#fff' : t.inkSecondary, ...typography.caption }}>
            শুধু বাকি
          </Text>
        </Pressable>
      </View>

      {error ? (
        <AnimatedPressable style={[styles.errorBanner, { backgroundColor: t.payTint }]} onPress={() => void load()} haptic="light">
          <Text style={[styles.errorText, { color: t.pay }]}>{error} · আবার চেষ্টা করুন</Text>
        </AnimatedPressable>
      ) : null}

      {loading ? (
        <ScreenLoader />
      ) : parties.length === 0 ? (
        <EmptyState
          icon="customers"
          title={partyTypeEmptyTitle(segment)}
          ctaLabel="+ নতুন যোগ করুন"
          onCta={() => router.push({ pathname: '/party/new', params: { type: segment } })}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: insets.bottom + 100 }}
          renderItem={({ item, index }) => {
            const color = item.balance > 0 ? t.receive : item.balance < 0 ? t.pay : t.muted;
            return (
              <Animated.View entering={FadeInUp.duration(350).delay(index * 40)}>
                <AnimatedPressable
                  variant="row"
                  onPress={() => router.push({ pathname: '/party/[id]', params: { id: item.id } })}
                  haptic="light"
                >
                <SurfaceCard style={styles.tile} padded>
                <View style={[styles.avatar, { backgroundColor: color + '33' }]}>
                  <Text style={[styles.avatarText, { color }]}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: t.ink }]}>{item.name}</Text>
                  <Text style={[styles.activity, { color: t.muted }]}>{item.last_activity_at?.slice(0, 10) ?? '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <TakaAmount amount={Math.abs(item.balance)} color={color} size="sm" />
                  {item.balance > 0 && item.phone ? (
                    <PremiumReminderActions
                      phone={item.phone}
                      partyName={item.name}
                      balance={item.balance}
                      shopName={business.name}
                      template={business.reminder_sms_template}
                      layout="compact"
                    />
                  ) : null}
                </View>
                </SurfaceCard>
                </AnimatedPressable>
              </Animated.View>
            );
          }}
        />
      )}
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  seg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  segActive: { backgroundColor: colors.white },
  segText: { ...typography.label, color: 'rgba(255,255,255,0.9)' },
  segTextActive: { color: colors.brand },
  addPill: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  addPillText: { ...typography.caption, color: colors.white, fontFamily: fonts.bengaliSemiBold },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.lg },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, gap: 4 },
  statLabel: { ...typography.caption },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  duesChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bengaliBold, fontSize: 20 },
  name: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  activity: { ...typography.caption },
  errorBanner: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { ...typography.caption, textAlign: 'center' },
});
