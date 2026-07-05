import { type ReactNode } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useUiPreferences } from '@/context/UiPreferencesContext';

import { cardSurfaceStyle } from '@/lib/ui/cardSurfaceStyle';

import { fonts, radius, spacing, typography } from '@/constants/theme';



type MetricVariant = 'receive' | 'pay' | 'neutral' | 'amber';



interface MetricCardProps {

  variant?: MetricVariant;

  label: string;

  value: ReactNode;

  icon?: ReactNode;

}



export function MetricCard({ variant = 'neutral', label, value, icon }: MetricCardProps) {

  const { resolvedTheme: t } = useUiPreferences();



  const variantStyles: Record<MetricVariant, { bg: string; border: string }> = {

    receive: { bg: t.receiveTint, border: t.receiveTintBorder },

    pay: { bg: t.payTint, border: t.payTintBorder },

    neutral: { bg: t.neutralTint, border: t.neutralTintBorder },

    amber: { bg: t.amberTint, border: t.amberTintBorder },

  };



  const tint = variantStyles[variant];

  return (

    <View style={[styles.card, cardSurfaceStyle(t), { backgroundColor: tint.bg }]}>

      {icon}

      <Text style={[styles.label, { color: t.mutedDark }]}>{label}</Text>

      {typeof value === 'string' || typeof value === 'number' ? (

        <Text style={[styles.value, { color: t.ink }]}>{value}</Text>

      ) : (

        value

      )}

    </View>

  );

}



const styles = StyleSheet.create({

  card: {

    flex: 1,

    borderRadius: radius.xl,

    padding: spacing.lg,

    alignItems: 'center',

    gap: spacing.xs,

  },

  label: {

    ...typography.caption,

    fontFamily: fonts.bengaliSemiBold,

  },

  value: {

    fontFamily: fonts.numeral,

    fontSize: 24,

    lineHeight: 30,

  },

});

