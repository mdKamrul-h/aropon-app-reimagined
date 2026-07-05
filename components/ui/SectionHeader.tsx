import { StyleSheet, Text, View } from 'react-native';
import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, spacing, typography } from '@/constants/theme';

interface SectionHeaderProps {
  icon?: IconName;
  emoji?: string;
  title: string;
}

export function SectionHeader({ icon, emoji, title }: SectionHeaderProps) {
  const { resolvedTheme: t } = useUiPreferences();
  return (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${t.brand}15` }]}>
          <AroponIcon name={icon} size={20} />
        </View>
      ) : emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : null}
      <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20, lineHeight: 26 },
  title: { ...typography.sectionTitle, fontFamily: fonts.bengaliBold },
});
