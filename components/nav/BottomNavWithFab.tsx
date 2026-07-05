import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { AroponIcon, type IconName } from '@/components/icons/AroponIcon';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { FabButton } from '@/components/nav/QuickAddSheet';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { cardSurfaceStyle } from '@/lib/ui/cardSurfaceStyle';
import { spacing, typography } from '@/constants/theme';

interface TabItem {
  key: string;
  label: string;
  icon: IconName;
}

const LEFT: TabItem[] = [
  { key: 'home', label: 'হোম', icon: 'home' },
  { key: 'accounting', label: 'হিসাব', icon: 'ledger' },
];
const RIGHT: TabItem[] = [
  { key: 'inventory', label: 'মালামাল', icon: 'inventory' },
  { key: 'more', label: 'আরও', icon: 'more' },
];

interface BottomNavWithFabProps {
  active: string;
  fabOpen?: boolean;
  onTab: (key: string) => void;
  onFab: () => void;
  onFabLongPress?: () => void;
}

function TabButton({
  item,
  active,
  onPress,
}: {
  item: TabItem;
  active: boolean;
  onPress: () => void;
}) {
  const { resolvedTheme: t, preferences } = useUiPreferences();
  const scale = useSharedValue(active ? 1 : 1);
  const pulse = useSharedValue(1);
  const inactiveColor = t.muted;
  const activeColor = t.brand;

  useEffect(() => {
    scale.value = withSpring(active ? 1.02 : 1, { damping: 18, stiffness: 300 });
    if (active && preferences.playfulness.pulse) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.04, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [active, scale, pulse, preferences.playfulness.pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  return (
    <AnimatedPressable variant="ghost" style={styles.tab} onPress={onPress} haptic="light">
      <Animated.View style={[styles.tabInner, animStyle]}>
        <View style={[styles.iconWrap, active && { backgroundColor: `${t.brand}18` }]}>
          <AroponIcon name={item.icon} size={26} />
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: active ? activeColor : inactiveColor },
            active && styles.tabLabelActive,
          ]}
        >
          {item.label}
        </Text>
        {active ? <View style={[styles.activeDot, { backgroundColor: t.brand }]} /> : null}
      </Animated.View>
    </AnimatedPressable>
  );
}

export function BottomNavWithFab({ active, fabOpen = false, onTab, onFab, onFabLongPress }: BottomNavWithFabProps) {
  const { resolvedTheme: t } = useUiPreferences();

  const barContent = (
    <>
      <View style={styles.side}>
        {LEFT.map((tab) => (
          <TabButton key={tab.key} item={tab} active={active === tab.key} onPress={() => onTab(tab.key)} />
        ))}
      </View>
      <View style={styles.fabSpacer} />
      <View style={styles.side}>
        {RIGHT.map((tab) => (
          <TabButton key={tab.key} item={tab} active={active === tab.key} onPress={() => onTab(tab.key)} />
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.barWrap,
          cardSurfaceStyle(t),
          {
            borderTopLeftRadius: t.radiusXl,
            borderTopRightRadius: t.radiusXl,
            backgroundColor: t.card,
            borderBottomWidth: 0,
          },
        ]}
      >
        <View style={[styles.topBorder, { backgroundColor: t.border }]} />
        <View style={styles.bar}>{barContent}</View>
      </View>
      <View style={styles.fabOverlay} pointerEvents="box-none">
        <View pointerEvents="auto">
          <FabButton onPress={onFab} onLongPress={onFabLongPress} open={fabOpen} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 50,
  },
  barWrap: {
    overflow: 'visible',
  },
  topBorder: {
    height: 1,
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  side: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  fabSpacer: { width: 72 },
  fabOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -26,
    alignItems: 'center',
    zIndex: 60,
    elevation: 60,
  },
  tab: { alignItems: 'center', minWidth: 64, paddingVertical: 4 },
  tabInner: { alignItems: 'center', gap: 3 },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { ...typography.caption },
  tabLabelActive: { fontFamily: typography.sectionTitle.fontFamily },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
