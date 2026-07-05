import { Pressable, Text, StyleSheet, View } from 'react-native';

import { TakaAmount } from '@/components/ui/TakaAmount';

import { useUiPreferences } from '@/context/UiPreferencesContext';

import { cardSurfaceStyle } from '@/lib/ui/cardSurfaceStyle';

import { radius, spacing, typography } from '@/constants/theme';



export type DayFilter = 'today' | 'yesterday' | 'all';



interface DayFilterChipsProps {

  value: DayFilter;

  onChange: (v: DayFilter) => void;

}



const OPTIONS: { key: DayFilter; label: string }[] = [

  { key: 'today', label: 'আজ' },

  { key: 'yesterday', label: 'গতকাল' },

  { key: 'all', label: 'সব' },

];



export function DayFilterChips({ value, onChange }: DayFilterChipsProps) {

  const { resolvedTheme: t } = useUiPreferences();



  return (

    <View style={styles.row}>

      {OPTIONS.map((o) => {

        const active = value === o.key;

        return (

          <Pressable

            key={o.key}

            onPress={() => onChange(o.key)}

            style={[

              styles.chip,

              {

                backgroundColor: active ? t.segmentActive : t.card,

                borderColor: active ? t.brand : t.border,

              },

            ]}

          >

            <Text

              style={[

                styles.chipText,

                { color: active ? t.ink : t.inkSecondary },

              ]}

            >

              {o.label}

            </Text>

          </Pressable>

        );

      })}

    </View>

  );

}



interface DaySummaryCardsProps {

  income: number;

  expense: number;

}



export function DaySummaryCards({ income, expense }: DaySummaryCardsProps) {

  const { resolvedTheme: t } = useUiPreferences();



  return (

    <View style={styles.summaryRow}>

      <View style={[styles.card, cardSurfaceStyle(t), { backgroundColor: t.receiveTint }]}>

        <Text style={[styles.label, { color: t.mutedDark }]}>মোট আয়</Text>

        <TakaAmount amount={income} color={t.receive} size="sm" />

      </View>

      <View style={[styles.card, cardSurfaceStyle(t), { backgroundColor: t.payTint }]}>

        <Text style={[styles.label, { color: t.mutedDark }]}>মোট ব্যয়</Text>

        <TakaAmount amount={expense} color={t.pay} size="sm" />

      </View>

      <View style={[styles.card, cardSurfaceStyle(t), { backgroundColor: t.neutralTint }]}>

        <Text style={[styles.label, { color: t.mutedDark }]}>নিট</Text>

        <TakaAmount amount={income - expense} color={t.brand} size="sm" />

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  row: { flexDirection: 'row', gap: spacing.sm },

  chip: {

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.sm,

    borderRadius: radius.pill,

    borderWidth: 1,

  },

  chipText: { ...typography.bodySm },

  summaryRow: { flexDirection: 'row', gap: spacing.sm },

  card: { flex: 1, padding: spacing.md, borderRadius: radius.lg, gap: 4 },

  label: { ...typography.caption },

});

