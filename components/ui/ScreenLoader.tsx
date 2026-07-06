import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { FadeInSection } from '@/components/ui/FadeInSection';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { spacing } from '@/constants/theme';

interface ScreenLoaderProps {
  style?: ViewStyle;
  skeleton?: boolean;
}

export function ScreenLoader({ style, skeleton }: ScreenLoaderProps) {
  const { resolvedTheme: t } = useUiPreferences();

  if (skeleton) {
    return (
      <FadeInSection>
        <View style={[styles.wrap, styles.skeletonWrap, { backgroundColor: t.surface }, style]}>
          <SkeletonList count={5} />
        </View>
      </FadeInSection>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: t.surface }, style]}>
      <ActivityIndicator size="large" color={t.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonWrap: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: spacing.lg,
  },
});
