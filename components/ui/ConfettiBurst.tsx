import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#22b8cf', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb7185'];

export function ConfettiBurst() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    x: (Math.random() - 0.5) * 160,
    y: -40 - Math.random() * 80,
    rot: Math.random() * 360,
  }));

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </View>
  );
}

function ConfettiParticle({
  color,
  x,
  y,
  rot,
}: {
  color: string;
  x: number;
  y: number;
  rot: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(y, { duration: 900 });
    opacity.value = withDelay(500, withTiming(0, { duration: 400 }));
  }, [opacity, translateY, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x }, { translateY: translateY.value }, { rotate: `${rot}deg` }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
