import type { IconName } from '@/components/icons/AroponIcon';
import { TRANSACTION_ACTIONS } from '@/constants/actions';

export interface QuickAddAction {
  label: string;
  icon: IconName;
  route: string;
}

const DESCRIPTIVE_LABELS: Record<string, string> = {
  sale: 'নতুন বিক্রি',
  purchase: 'নতুন ক্রয়',
  receive: 'টাকা আদায়',
  pay: 'টাকা দেওয়া',
  expense: 'খরচ',
};

/** Sourced from the canonical TRANSACTION_ACTIONS list (same routes as the
 * home quick actions), most-used verbs first, calculator last. */
export const QUICK_ADD_ACTIONS: QuickAddAction[] = [
  ...TRANSACTION_ACTIONS.map((a) => ({
    label: DESCRIPTIVE_LABELS[a.key],
    icon: a.icon,
    route: a.href as string,
  })),
  { label: 'ক্যালকুলেটর দিয়ে যোগ করুন', icon: 'flash', route: '/calculator' },
];
