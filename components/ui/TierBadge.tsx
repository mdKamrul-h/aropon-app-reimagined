import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, typography } from '@/constants/theme';

interface TierBadgeProps {
  label?: string;
}

export function TierBadge({ label = 'প্রো' }: TierBadgeProps) {
  return (
    <LinearGradient
      colors={['#fbbf24', '#f59e0b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.badge}
    >
      <Text style={styles.text}>👑 {label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    ...typography.caption,
    fontFamily: fonts.bengaliSemiBold,
    color: '#fff',
  },
});
