import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';

interface GradientAppBarProps {
  title?: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  variant?: 'hero' | 'tab';
  style?: ViewStyle;
  paddingTop?: number;
}

export function GradientAppBar({
  title,
  subtitle,
  left,
  right,
  children,
  variant = 'tab',
  style,
  paddingTop = spacing.lg,
}: GradientAppBarProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const gradient =
    variant === 'hero'
      ? ([...t.heroGradient] as const)
      : ([t.mood.primary, t.mood.accent] as const);

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bar, { paddingTop }]}
      >
        {(title || left || right) && (
          <View style={styles.row}>
            <View style={styles.left}>{left}</View>
            <View style={styles.center}>
              {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            <View style={styles.right}>{right}</View>
          </View>
        )}
        {children}
      </LinearGradient>
      <View style={[styles.goldAccent, { backgroundColor: t.brandGold }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  bar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  goldAccent: {
    height: 3,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  left: { minWidth: 40 },
  center: { flex: 1 },
  right: { minWidth: 40, alignItems: 'flex-end' },
  title: {
    ...typography.screenTitle,
    color: colors.white,
    fontFamily: fonts.bengaliBold,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
