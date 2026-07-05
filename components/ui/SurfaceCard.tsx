import { type ReactNode } from 'react';
import { AppCard } from '@/components/layout/AppCard';
import { type StyleProp, type ViewStyle } from 'react-native';

interface SurfaceCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
}

export function SurfaceCard({ children, style, padded = true }: SurfaceCardProps) {
  return (
    <AppCard style={style} padded={padded}>
      {children}
    </AppCard>
  );
}
