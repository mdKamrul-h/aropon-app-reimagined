import type { PaymentMethod } from '@/types/schema';

/** UI labels — `cash` is liquid money (ক্যাশ); `nagad` is the MFS wallet brand (নগদ). */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'ক্যাশ',
  bkash: 'বিকাশ',
  nagad: 'নগদ',
  rocket: 'রকেট',
  card: 'কার্ড',
};

export const PAYMENT_METHODS_UI: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: PAYMENT_METHOD_LABELS.cash },
  { key: 'bkash', label: PAYMENT_METHOD_LABELS.bkash },
  { key: 'nagad', label: PAYMENT_METHOD_LABELS.nagad },
  { key: 'rocket', label: PAYMENT_METHOD_LABELS.rocket },
  { key: 'card', label: PAYMENT_METHOD_LABELS.card },
];

export function paymentMethodLabel(method: PaymentMethod | string | null | undefined): string {
  if (!method) return PAYMENT_METHOD_LABELS.cash;
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? String(method);
}

/** Label for cash-vs-credit sale toggle (not MFS). */
export const CASH_PAYMENT_TOGGLE_LABEL = PAYMENT_METHOD_LABELS.cash;
