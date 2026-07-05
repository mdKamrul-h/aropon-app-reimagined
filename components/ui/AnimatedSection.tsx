import { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { useUiPreferences } from '@/context/UiPreferencesContext';

interface AnimatedSectionProps {
  children: ReactNode;
  index?: number;
  direction?: 'down' | 'up';
  style?: ViewStyle;
}

export function AnimatedSection({
  children,
  index = 0,
  direction = 'down',
  style,
}: AnimatedSectionProps) {
  const { preferences, resolvedTheme: t } = useUiPreferences();
  const delay = index * 60;
  const duration = t.animationDuration(400);

  if (preferences.entranceAnimation === 'none') {
    return <View style={style}>{children}</View>;
  }

  let entering;
  if (preferences.entranceAnimation === 'pop') {
    entering = ZoomIn.duration(duration).delay(delay);
  } else if (preferences.entranceAnimation === 'slide') {
    entering =
      direction === 'up'
        ? FadeInUp.duration(duration).delay(delay)
        : FadeInDown.duration(duration).delay(delay);
  } else {
    entering = FadeInDown.duration(duration).delay(delay);
  }

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
