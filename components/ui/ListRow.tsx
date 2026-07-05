import { StyleSheet, Text, View } from 'react-native';

import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

import { useUiPreferences } from '@/context/UiPreferencesContext';

import { fonts, radius, spacing, typography } from '@/constants/theme';



interface ListRowProps {

  icon?: IconName;

  label: string;

  badge?: string;

  subtitle?: string;

  onPress?: () => void;

  showChevron?: boolean;

  haptic?: boolean;

}



export function ListRow({

  icon,

  label,

  badge,

  subtitle,

  onPress,

  showChevron = true,

  haptic = true,

}: ListRowProps) {

  const { resolvedTheme: t } = useUiPreferences();



  return (

    <AnimatedPressable

      variant="row"

      style={styles.row}

      onPress={onPress}

      haptic={haptic ? 'light' : 'none'}

      disabled={!onPress}

    >

      {icon ? <AroponIcon name={icon} size={28} /> : null}

      <View style={styles.body}>

        <Text style={[styles.label, { color: t.ink }]}>{label}</Text>

        {subtitle ? <Text style={[styles.subtitle, { color: t.muted }]}>{subtitle}</Text> : null}

      </View>

      {badge ? (

        <View style={[styles.badge, { backgroundColor: `${t.brand}22` }]}>

          <Text style={[styles.badgeText, { color: t.brand }]}>{badge}</Text>

        </View>

      ) : null}

      {showChevron && onPress ? (

        <Text style={[styles.chevron, { color: t.inkSecondary }]}>›</Text>

      ) : null}

    </AnimatedPressable>

  );

}



const styles = StyleSheet.create({

  row: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: spacing.md,

    paddingVertical: spacing.md,

    paddingHorizontal: spacing.md,

    minHeight: spacing.touchMin,

  },

  body: { flex: 1, gap: 2 },

  label: { ...typography.bodySm },

  subtitle: { ...typography.caption },

  badge: {

    paddingHorizontal: spacing.sm,

    paddingVertical: spacing.xs,

    borderRadius: radius.pill,

  },

  badgeText: {

    ...typography.caption,

    fontFamily: fonts.bengaliSemiBold,

  },

  chevron: { fontSize: 24 },

});

