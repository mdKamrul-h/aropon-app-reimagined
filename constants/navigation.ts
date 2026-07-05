export type TabShellActive = 'home' | 'accounting' | 'inventory' | 'more';

/** Map pathname segments to bottom-nav highlight */
export function resolveActiveTab(pathname: string): TabShellActive {
  if (pathname.includes('/accounting') || pathname.includes('-khata') || pathname.includes('/ledger')) {
    return 'accounting';
  }
  if (pathname.includes('/inventory')) {
    return 'inventory';
  }
  if (
    pathname.includes('/more') ||
    pathname.includes('/reports') ||
    pathname.includes('/loans') ||
    pathname.includes('/settings') ||
    pathname.includes('/credit-score') ||
    pathname.includes('/learning') ||
    pathname.includes('/profile') ||
    pathname.includes('/backup') ||
    pathname.includes('/help') ||
    pathname.includes('/staff')
  ) {
    return 'more';
  }
  return 'home';
}

export const TAB_ROUTES: Record<TabShellActive, string> = {
  home: '/(tabs)',
  accounting: '/(tabs)/accounting',
  inventory: '/(tabs)/inventory',
  more: '/(tabs)/more',
};

/** Stack screens that should show bottom nav + FAB */
export const STACK_WITH_NAV_PATTERNS = [
  '/khata',
  '/ledger',
  '/reports',
  '/loans',
  '/notifications',
  '/settings',
  '/profile',
  '/backup',
  '/help',
  '/staff',
  '/learning',
  '/credit-score',
];

export function stackShowsBottomNav(pathname: string): boolean {
  return STACK_WITH_NAV_PATTERNS.some((p) => pathname.includes(p));
}
