import type { Href } from 'expo-router';
import type { IconName } from '@/components/icons/AroponIcon';

/**
 * Canonical transaction-entry verbs. Every add-transaction entry point
 * (home quick actions, the FAB quick-add sheet, calculator shortcuts)
 * should read from this single list so the same task always offers the
 * same wording and the same route, instead of drifting per screen.
 */
export interface TransactionAction {
  key: 'sale' | 'purchase' | 'receive' | 'pay' | 'expense';
  label: string;
  icon: IconName;
  href: Href;
}

export const TRANSACTION_ACTIONS: TransactionAction[] = [
  { key: 'sale', label: 'বিক্রি', icon: 'orders', href: '/transaction/sale' },
  { key: 'purchase', label: 'ক্রয়', icon: 'grocery', href: '/transaction/purchase' },
  { key: 'receive', label: 'আদায়', icon: 'income', href: '/transaction/receive' },
  { key: 'pay', label: 'পরিশোধ', icon: 'expense', href: '/transaction/pay' },
  { key: 'expense', label: 'খরচ', icon: 'wallet', href: '/transaction/expense' },
];

export function transactionAction(key: TransactionAction['key']): TransactionAction {
  const action = TRANSACTION_ACTIONS.find((a) => a.key === key);
  if (!action) throw new Error(`Unknown transaction action: ${key}`);
  return action;
}

export function isTabHref(href: Href): boolean {
  return typeof href === 'string' && href.startsWith('/(tabs)/');
}

/** Bengali label for any raw transaction type, for screens that show a
 * transaction's note with a type-name fallback (recent-activity lists,
 * ledger rows) so the fallback is never a raw English enum value. */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  sale: 'বিক্রি',
  purchase: 'ক্রয়',
  payment_in: 'আদায়',
  payment_out: 'পরিশোধ',
  expense: 'খরচ',
};
