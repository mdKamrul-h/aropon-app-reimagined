import type { IconName } from '@/components/icons/aroponIconData';
import type { BusinessType } from '@/types/schema';

export interface BusinessTypeOption {
  key: BusinessType;
  label: string;
  icon: IconName;
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { key: 'grocery', label: 'মুদি / কাঁচাবাজার', icon: 'grocery' },
  { key: 'pharmacy', label: 'ফার্মেসি', icon: 'tag' },
  { key: 'garment', label: 'কাপড় / বুটিক', icon: 'garment' },
  { key: 'food', label: 'খাবার / রেস্টুরেন্ট', icon: 'orders' },
  { key: 'electronics', label: 'ইলেকট্রনিক্স', icon: 'flash' },
  { key: 'hardware', label: 'হার্ডওয়্যার / নির্মাণ', icon: 'inventory' },
  { key: 'salon', label: 'সেলুন / সৌন্দর্য', icon: 'profile' },
  { key: 'automotive', label: 'গ্যারেজ / যানবাহন', icon: 'receipt' },
  { key: 'agriculture', label: 'কৃষি / খামার', icon: 'savings' },
  { key: 'wholesale', label: 'পাইকারি / ডিস্ট্রিবিউশন', icon: 'inventory' },
  { key: 'services', label: 'পরিষেবা / দক্ষতা', icon: 'customers' },
  { key: 'ecommerce', label: 'অনলাইন / ই-কমার্স', icon: 'mobilepay' },
  { key: 'other', label: 'অন্যান্য', icon: 'more' },
];

export const LENDER_OTHER_ID = 'other';

export interface LenderOption {
  id: string;
  label: string;
  category: 'bank' | 'mfi' | 'digital' | 'personal' | 'other';
}

export const LENDER_OPTIONS: LenderOption[] = [
  { id: 'dbbl', label: 'Dutch-Bangla Bank', category: 'bank' },
  { id: 'brac-bank', label: 'BRAC Bank', category: 'bank' },
  { id: 'islami', label: 'Islami Bank', category: 'bank' },
  { id: 'city', label: 'City Bank', category: 'bank' },
  { id: 'sonali', label: 'Sonali Bank', category: 'bank' },
  { id: 'brac-mfi', label: 'BRAC (মাইক্রো)', category: 'mfi' },
  { id: 'asa', label: 'ASA', category: 'mfi' },
  { id: 'shakti', label: 'Shakti', category: 'mfi' },
  { id: 'bkash', label: 'bKash', category: 'digital' },
  { id: 'nagad', label: 'Nagad', category: 'digital' },
  { id: 'rocket', label: 'Rocket', category: 'digital' },
  { id: 'personal', label: 'আত্মীয় / ব্যক্তিগত', category: 'personal' },
  { id: LENDER_OTHER_ID, label: 'অন্যান্য', category: 'other' },
];

export const LENDER_CATEGORY_LABELS: Record<LenderOption['category'], string> = {
  bank: 'ব্যাংক',
  mfi: 'মাইক্রোফাইন্যান্স',
  digital: 'মোবাইল ওয়ালেট',
  personal: 'ব্যক্তিগত',
  other: 'অন্যান্য',
};

export const DISTRICT_QUICK_PICKS = [
  'ঢাকা',
  'চট্টগ্রাম',
  'সিলেট',
  'রাজশাহী',
  'খুলনা',
  'বরিশাল',
  'রংপুর',
  'ময়মনসিংহ',
] as const;

export const DISTRICT_SKIP = '—';

export function lenderLabelById(id: string): string {
  return LENDER_OPTIONS.find((l) => l.id === id)?.label ?? id;
}
