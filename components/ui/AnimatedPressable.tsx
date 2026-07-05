import { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useUiPreferences } from '@/context/UiPreferencesContext';

export type AnimatedPressableVariant = 'tile' | 'row' | 'chip' | 'ghost';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: AnimatedPressableVariant;
  haptic?: 'light' | 'none';
  scaleTo?: number;
}

const SPRING = { damping: 18, stiffness: 320 };
const BOUNCE_SPRING = { damping: 12, stiffness: 280 };

export function AnimatedPressable({
  children,
  style,
  variant = 'ghost',
  haptic = 'none',
  scaleTo,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: AnimatedPressableProps) {
  const { preferences, resolvedTheme: t } = useUiPreferences();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const ripple = useSharedValue(0);

  const pressScale = scaleTo ?? t.bounceScale;
  const spring = preferences.playfulness.bounce ? BOUNCE_SPRING : SPRING;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.value * 0.25,
    transform: [{ scale: 1 + ripple.value * 0.15 }],
  }));

  const triggerHaptic = () => {
    if (haptic === 'light' && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        variantStyles[variant],
        Platform.OS === 'web' && styles.webPressable,
        style,
        Platform.OS === 'web' && pressed && styles.webPressed,
      ]}
      onPressIn={(e) => {
        scale.value = withSpring(pressScale, spring);
        opacity.value = withSpring(0.9, spring);
        if (preferences.tapRipple) {
          ripple.value = withSpring(1, { damping: 20, stiffness: 300 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring);
        opacity.value = withSpring(1, spring);
        ripple.value = withSpring(0, spring);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        triggerHaptic();
        onPress?.(e);
      }}
    >
      {preferences.tapRipple ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: t.brand,
              borderRadius: t.radiusLg,
            },
            rippleStyle,
          ]}
        />
      ) : null}
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

const variantStyles: Record<AnimatedPressableVariant, ViewStyle> = {
  tile: { overflow: 'hidden' },
  row: {},
  chip: {},
  ghost: {},
};

const styles = StyleSheet.create({
  webPressable: Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : {},
  webPressed: Platform.OS === 'web' ? ({ opacity: 0.88 } as ViewStyle) : {},
});
