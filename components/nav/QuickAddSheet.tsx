import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { FadeInSection } from '@/components/ui/FadeInSection';
import { ListRow } from '@/components/ui/ListRow';
import { QUICK_ADD_ACTIONS } from '@/constants/quickAddActions';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { colors, radius, spacing, typography } from '@/constants/theme';

interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
}

function QuickAddActionList({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <>
      <Text style={[styles.title, { color: t.ink }]}>দ্রুত যোগ করুন</Text>
      {QUICK_ADD_ACTIONS.map((a, i) => (
        <FadeInSection key={a.route} index={i} direction="up">
          <ListRow
            icon={a.icon}
            label={a.label}
            onPress={() => {
              onClose();
              router.push(a.route as never);
            }}
          />
        </FadeInSection>
      ))}
    </>
  );
}

export function QuickAddSheet({ visible, onClose }: QuickAddSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['52%'], []);
  const { resolvedTheme: t } = useUiPreferences();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.webBackdrop} onPress={onClose}>
          <Pressable
            style={[
              styles.webSheet,
              {
                paddingBottom: insets.bottom + spacing.xl,
                backgroundColor: t.card,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: t.border }]} />
            <QuickAddActionList onClose={onClose} />
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[styles.handle, { backgroundColor: t.border }]}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetView style={[styles.sheet, { paddingBottom: insets.bottom + 80 }]}>
        <QuickAddActionList onClose={onClose} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

interface FabButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  open?: boolean;
}

export function FabButton({ onPress, onLongPress, open = false }: FabButtonProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(open ? 45 : 0, { damping: 14, stiffness: 200 });
  }, [open, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const gradient = (
    <LinearGradient
      colors={[t.ctaGradient[0], t.ctaGradient[1]]}
      style={[
        styles.fab,
        { borderColor: t.isDark ? 'rgba(255,255,255,0.28)' : colors.white },
      ]}
    >
      <Animated.Text style={[styles.fabIcon, iconStyle]}>＋</Animated.Text>
    </LinearGradient>
  );

  if (Platform.OS === 'web') {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.fabWrap}
      >
        {gradient}
      </Pressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      haptic="light"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.fabWrap}
    >
      {gradient}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  handle: { backgroundColor: colors.border, width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  sheetBg: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
  },
  sheet: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  webBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  webSheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.xs,
    maxHeight: '60%',
  },
  title: { ...typography.screenTitle, marginBottom: spacing.sm },
  fabWrap: {
    zIndex: 30,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: { fontSize: 32, color: colors.white, lineHeight: 36 },
});
