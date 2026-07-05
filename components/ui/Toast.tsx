import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/constants/theme';

export type ToastVariant = 'success' | 'error';

export interface ToastPayload {
  message: string;
  variant: ToastVariant;
}

interface ToastProps extends ToastPayload {
  visible: boolean;
  onDismiss: () => void;
}

const DISMISS_MS = 3200;

export function Toast({ message, variant, visible, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, DISMISS_MS);

    return () => clearTimeout(timer);
  }, [visible, message, variant, opacity, translateY, onDismiss]);

  if (!visible) return null;

  const isSuccess = variant === 'success';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + spacing.sm, opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        onPress={onDismiss}
        style={[styles.banner, isSuccess ? styles.success : styles.error]}
      >
        <Text style={styles.icon}>{isSuccess ? '✓' : '!'}</Text>
        <Text style={styles.message}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  success: {
    backgroundColor: colors.receive,
  },
  error: {
    backgroundColor: colors.pay,
  },
  icon: {
    ...typography.sectionTitle,
    color: colors.white,
    width: 24,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySm,
    color: colors.white,
    flex: 1,
  },
});
