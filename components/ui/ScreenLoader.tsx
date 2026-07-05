import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { FadeInSection } from '@/components/ui/FadeInSection';
import { SkeletonList } from '@/components/ui/Skeleton';
import { colors, spacing } from '@/constants/theme';

interface ScreenLoaderProps {
  style?: ViewStyle;
  skeleton?: boolean;
}

export function ScreenLoader({ style, skeleton }: ScreenLoaderProps) {
  if (skeleton) {
    return (
      <FadeInSection>
        <View style={[styles.wrap, styles.skeletonWrap, style]}>
          <SkeletonList count={5} />
        </View>
      </FadeInSection>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  skeletonWrap: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: spacing.lg,
  },
});
