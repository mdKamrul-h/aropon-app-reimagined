import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

const KEYS = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '', '০', '⌫'];

const BN_TO_ASCII: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

interface NumericKeypadProps {
  onKey: (key: string) => void;
}

export function NumericKeypad({ onKey }: NumericKeypadProps) {
  return (
    <View style={styles.grid}>
      {KEYS.map((key, i) => (
        <Pressable
          key={i}
          style={[styles.key, !key && styles.keyEmpty]}
          onPress={() => {
            if (!key) return;
            if (key === '⌫') onKey('back');
            else onKey(BN_TO_ASCII[key] ?? key);
          }}
          disabled={!key}
        >
          <Text style={styles.keyText}>{key}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.md,
  },
  key: {
    width: '30%',
    aspectRatio: 1.6,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  keyText: { ...typography.heroAmount, fontSize: 28, color: colors.ink },
});
