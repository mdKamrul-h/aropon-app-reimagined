import type { Href } from 'expo-router';
import type { IconName } from '@/components/icons/AroponIcon';
import { TRANSACTION_ACTIONS, isTabHref } from '@/constants/actions';

export interface HomeQuickAction {
  label: string;
  icon: IconName;
  href: Href;
}

/** Main transaction shortcuts — 2×2 grid. Sourced from the canonical
 * TRANSACTION_ACTIONS list so home and the FAB quick-add sheet always
 * offer the same verbs routed to the same screens. */
export const HOME_PRIMARY_ACTIONS: HomeQuickAction[] = ['sale', 'purchase', 'receive', 'expense'].map(
  (key) => {
    const a = TRANSACTION_ACTIONS.find((x) => x.key === key)!;
    return { label: a.label, icon: a.icon, href: a.href };
  },
);

/** Secondary shortcuts — compact row (aropon v2) */
export const HOME_SERVICE_ACTIONS: HomeQuickAction[] = [
  { label: 'হিসাব', icon: 'ledger', href: '/(tabs)/accounting' },
  { label: 'স্টক', icon: 'inventory', href: '/(tabs)/inventory' },
  { label: 'গ্রাহক', icon: 'customers', href: '/khata' },
  { label: 'রিপোর্ট', icon: 'profit', href: '/reports' },
];

export { isTabHref };
