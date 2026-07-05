import { StyleSheet, Text, View } from 'react-native';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { AroponIcon } from '@/components/icons/AroponIcon';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, typography } from '@/constants/theme';

interface InsightBannerProps {
  title: string;
  body: string;
  badge?: string;
}

export function InsightBanner({ title, body, badge = 'টিপ' }: InsightBannerProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <SurfaceCard style={{ gap: 10, borderLeftWidth: 3, borderLeftColor: t.brandGold }}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${t.brandGold}20` }]}>
          <AroponIcon name="book" size={18} />
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={[styles.badge, { backgroundColor: `${t.brand}18` }]}>
              <Text style={[styles.badgeText, { color: t.brand }]}>{badge}</Text>
            </View>
            <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.body, { color: t.inkSecondary }]}>{body}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontFamily: fonts.bengaliSemiBold, fontSize: 12 },
  title: { ...typography.label, fontFamily: fonts.bengaliBold, flex: 1 },
  body: { ...typography.bodySm, lineHeight: 24 },
});
