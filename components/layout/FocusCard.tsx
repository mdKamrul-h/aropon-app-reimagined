import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppCard } from '@/components/layout/AppCard';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

export interface FocusItem {
  label: string;
  value: string;
  route: string;
}

interface FocusCardProps {
  items: FocusItem[];
  alertCount: number;
}

export function FocusCard({ items, alertCount }: FocusCardProps) {
  const router = useRouter();
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <AppCard style={{ gap: spacing.sm }} tint={t.isDark ? t.card : '#F4F8FC'}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.label, { color: t.muted }]}>আজকের নজর</Text>
          <Text style={[styles.value, { color: t.ink }]}>
            {alertCount > 0 ? `${alertCount} টি বিষয়` : 'সব ঠিক আছে'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/reports')} style={Platform.OS === 'web' ? styles.webLink : undefined}>
          <Text style={[styles.link, { color: t.brand }]}>বিস্তারিত</Text>
        </Pressable>
      </View>

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              style={[
                styles.row,
                { borderBottomColor: t.border },
                index === items.length - 1 && styles.lastRow,
              ]}
              onPress={() => router.push(item.route as never)}
            >
              <Text style={[styles.rowLabel, { color: t.ink }]}>{item.label}</Text>
              <Text style={[styles.rowValue, { color: t.brand }]}>{item.value}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: t.muted }]}>
          আজ জরুরি কোনো কাজ নেই। নিয়মিত লেনদেন চালিয়ে যান।
        </Text>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { ...typography.caption },
  value: { ...typography.cardAmount, fontSize: 22, lineHeight: 28 },
  link: { ...typography.label },
  webLink: Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : {},
  list: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { ...typography.bodySm, flex: 1 },
  rowValue: { ...typography.label },
  empty: { ...typography.bodySm, lineHeight: 24 },
});
