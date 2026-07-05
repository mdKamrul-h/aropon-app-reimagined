import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing, typography } from '@/constants/theme';

interface SectionBlockProps {
  title: string;
  meta?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function SectionBlock({ title, meta, icon, style }: SectionBlockProps) {
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${t.brand}15` }]}>
            <AroponIcon name={icon} size={20} color={t.brand} />
          </View>
        ) : null}
        <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
      </View>
      {meta ? <Text style={[styles.meta, { color: t.muted }]}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.sectionTitle },
  meta: { ...typography.caption, flexShrink: 1, textAlign: 'right' },
});
