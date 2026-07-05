import type { IconName } from '@/components/icons/AroponIcon';

export interface QuickAddAction {
  label: string;
  icon: IconName;
  route: string;
}

export const QUICK_ADD_ACTIONS: QuickAddAction[] = [
  { label: 'ক্যালকুলেটর দিয়ে যোগ করুন', icon: 'flash', route: '/calculator' },
  { label: 'নতুন বিক্রি', icon: 'orders', route: '/transaction/sale' },
  { label: 'নতুন ক্রয়', icon: 'grocery', route: '/transaction/purchase' },
  { label: 'টাকা আদায়', icon: 'income', route: '/transaction/receive' },
  { label: 'টাকা দেওয়া', icon: 'expense', route: '/transaction/pay' },
  { label: 'খরচ', icon: 'wallet', route: '/transaction/expense' },
];
