import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AroponLogo } from '@/components/brand/AroponLogo';
import { brand, colors, heroGradient } from '@/constants/theme';

interface AppSplashProps {
  onFinish: () => void;
}

export function AppSplash({ onFinish }: AppSplashProps) {
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo scales + fades in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      // App name fades in
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 260,
        delay: 60,
        useNativeDriver: true,
      }),
      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 220,
        delay: 40,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(1100),
      // Fade out entire screen
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(onFinish);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={[...heroGradient]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.centerContent}>
          {/* Logo with glow shadow */}
          <Animated.View
            style={[
              styles.logoWrap,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
          >
            <View style={styles.logoGlow} />
            <AroponLogo size={120} />
          </Animated.View>

          {/* App name */}
          <Animated.Text style={[styles.appName, { opacity: nameOpacity }]}>
            আরোপন
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            দোকানের হিসাব, সহজে হাতের মুঠোয়
          </Animated.Text>
        </View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: taglineOpacity }]}>
          <View style={styles.footerDots}>
            <View style={[styles.dot, { backgroundColor: colors.receive }]} />
            <View style={[styles.dot, { backgroundColor: colors.white, opacity: 0.4 }]} />
            <View style={[styles.dot, { backgroundColor: colors.pay }]} />
          </View>
          <Text style={styles.footerText}>by Antarious</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Decorative background circles
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 60,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(58,163,216,0.2)',
    bottom: 180,
    right: 30,
  },
  centerContent: {
    alignItems: 'center',
    gap: 20,
    flex: 1,
    justifyContent: 'center',
  },
  logoWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(58,163,216,0.25)',
  },
  appName: {
    fontFamily: 'HindSiliguri_700Bold',
    fontSize: 42,
    color: colors.white,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
    gap: 10,
  },
  footerDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
});
