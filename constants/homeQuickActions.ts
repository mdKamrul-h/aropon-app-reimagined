import type { Href } from 'expo-router';
import type { IconName } from '@/components/icons/AroponIcon';

export interface HomeQuickAction {
  label: string;
  icon: IconName;
  href: Href;
}

/** Main transaction shortcuts — 2×2 grid (aropon v2) */
export const HOME_PRIMARY_ACTIONS: HomeQuickAction[] = [
  { label: 'বিক্রি', icon: 'orders', href: '/transaction/sale' },
  { label: 'ক্রয়', icon: 'grocery', href: '/transaction/purchase' },
  { label: 'আদায়', icon: 'income', href: '/transaction/receive' },
  { label: 'খরচ', icon: 'expense', href: '/transaction/expense' },
];

/** Secondary shortcuts — compact row (aropon v2) */
export const HOME_SERVICE_ACTIONS: HomeQuickAction[] = [
  { label: 'হিসাব', icon: 'ledger', href: '/(tabs)/accounting' },
  { label: 'স্টক', icon: 'inventory', href: '/(tabs)/inventory' },
  { label: 'গ্রাহক', icon: 'customers', href: '/khata' },
  { label: 'রিপোর্ট', icon: 'profit', href: '/reports' },
];

export function isTabHref(href: Href): boolean {
  return typeof href === 'string' && href.startsWith('/(tabs)/');
}
