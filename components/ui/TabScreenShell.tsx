import { type ReactNode } from 'react';
import { AppScreenShell, type AppScreenVariant } from '@/components/layout/AppScreenShell';
import type { TabShellActive } from '@/constants/navigation';

interface TabScreenShellProps {
  children: ReactNode;
  variant?: AppScreenVariant;
  withNav?: boolean;
  tabActive?: TabShellActive;
}

/** @deprecated Prefer AppScreenShell directly */
export function TabScreenShell({
  children,
  variant = 'stack',
  withNav = false,
  tabActive,
}: TabScreenShellProps) {
  return (
    <AppScreenShell variant={variant} withNav={withNav} tabActive={tabActive}>
      {children}
    </AppScreenShell>
  );
}
