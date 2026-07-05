import { type ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Card } from '@/components/ui/Card';

interface PressableCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  haptic?: boolean;
}

export function PressableCard({
  children,
  onPress,
  style,
  padded = true,
  haptic = true,
}: PressableCardProps) {
  if (!onPress) {
    return (
      <Card padded={padded} style={style}>
        {children}
      </Card>
    );
  }

  return (
    <AnimatedPressable
      variant="tile"
      onPress={onPress}
      haptic={haptic ? 'light' : 'none'}
      style={[styles.pressable, style]}
    >
      <Card padded={padded} style={styles.inner}>
        {children}
      </Card>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: 20 },
  inner: { margin: 0 },
});
