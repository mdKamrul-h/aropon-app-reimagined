import { type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface FadeInSectionProps {
  children: ReactNode;
  index?: number;
  direction?: 'down' | 'up';
  style?: ViewStyle;
  delayMs?: number;
}

export function FadeInSection({
  children,
  index = 0,
  direction = 'down',
  style,
  delayMs = 60,
}: FadeInSectionProps) {
  const entering =
    direction === 'up'
      ? FadeInUp.duration(400).delay(index * delayMs)
      : FadeInDown.duration(400).delay(index * delayMs);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

interface StaggerListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  style?: ViewStyle;
}

export function StaggerList<T>({ items, keyExtractor, renderItem, style }: StaggerListProps<T>) {
  return (
    <View style={style}>
      {items.map((item, index) => (
        <FadeInSection key={keyExtractor(item, index)} index={index}>
          {renderItem(item, index)}
        </FadeInSection>
      ))}
    </View>
  );
}
