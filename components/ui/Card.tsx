import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

/** @deprecated Prefer SurfaceCard — Card now delegates to glass SurfaceCard for dark-mode consistency */
export function Card({ children, style, padded = true }: CardProps) {
  return (
    <SurfaceCard style={style} padded={padded}>
      {children}
    </SurfaceCard>
  );
}
