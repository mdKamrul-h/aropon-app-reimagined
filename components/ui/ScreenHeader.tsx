import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import type { Href } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backFallback?: Href;
  right?: ReactNode;
  children?: ReactNode;
  variant?: 'stack' | 'ledger' | 'modal';
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  backFallback = '/(tabs)',
  right,
  children,
  variant = 'stack',
}: ScreenHeaderProps) {
  return (
    <AppHeader
      variant={variant === 'modal' ? 'modal' : variant === 'ledger' ? 'ledger' : 'stack'}
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      backFallback={backFallback}
      right={right}
      ledgerPill={variant === 'ledger'}
    >
      {children}
    </AppHeader>
  );
}
