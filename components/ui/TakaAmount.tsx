import { Text, type TextStyle } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { typography } from '@/constants/theme';
import { formatTaka } from '@/utils/bn-numerals';

export type TakaAmountSize = 'sm' | 'md' | 'lg' | 'hero' | 'card';

interface TakaAmountProps {
  amount: number;
  color?: string;
  showSign?: boolean;
  size?: TakaAmountSize;
  style?: TextStyle;
}

const sizeStyles: Record<TakaAmountSize, TextStyle> = {
  sm: { fontFamily: typography.numeralLg.fontFamily, fontSize: 18, lineHeight: 24 },
  md: typography.numeralLg,
  lg: { fontFamily: typography.numeralLg.fontFamily, fontSize: 34, lineHeight: 40 },
  hero: typography.heroAmount,
  card: typography.cardAmount,
};

export function TakaAmount({
  amount,
  color,
  showSign,
  size = 'md',
  style,
}: TakaAmountProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const textColor = color ?? t.ink;

  return (
    <Text style={[sizeStyles[size], { color: textColor }, style]} numberOfLines={1}>
      {formatTaka(amount, { showSign })}
    </Text>
  );
}
