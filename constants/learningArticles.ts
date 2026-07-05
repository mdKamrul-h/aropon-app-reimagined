import type { BusinessType, LearningItem } from '@/types/schema';

const now = () => new Date().toISOString();
const base = () => ({
  created_at: now(),
  updated_at: now(),
  deleted_at: null as string | null,
  sync_status: 'synced' as const,
});

/** `*` in business_types = shown for all shop types */
export type LearningBusinessTag = BusinessType | '*';

export interface LearningArticleSeed
  extends Omit<LearningItem, keyof ReturnType<typeof base> | 'id'> {
  id: string;
  business_types: LearningBusinessTag[];
}

function article(
  id: string,
  business_types: LearningBusinessTag[],
  title_bn: string,
  title_en: string,
  summary_bn: string,
  summary_en: string,
  body_bn: string,
  body_en: string,
  category: string,
  sort_order: number,
  is_new = false,
): LearningArticleSeed {
  return {
    id,
    business_types,
    title_bn,
    title_en,
    summary_bn,
    summary_en,
    body_bn,
    body_en,
    category,
    sort_order,
    is_new,
    ...base(),
  };
}

export const LEARNING_ARTICLES: LearningArticleSeed[] = [
  article(
    'learn-khata',
    ['*'],
    'বাকি হিসাব সঠিকভাবে রাখুন',
    'Track credit properly',
    'খদ্দেরদের বাকি এক জায়গায় রাখুন, ভুল কমবে',
    'Keep customer dues in one place',
    'প্রতিদিন বিক্রির পর বাকি বিক্রি আলাদা লিখুন। সপ্তাহে একবার খাতা মিলিয়ে নিন। ফোন নম্বর দিলে পরে আদায় সহজ হয়।',
    'Log credit sales separately after each day. Reconcile weekly. Phone numbers make collection easier.',
    'খাতা',
    1,
    true,
  ),
  article(
    'learn-cashflow',
    ['*'],
    'ক্যাশ ফ্লো বোঝা',
    'Understand cash flow',
    'বিক্রি ভালো হলেও হাতে ক্যাশ কম? কেন?',
    'Good sales but low cash? Why?',
    'বাকি বিক্রি আয় দেখায় কিন্তু ক্যাশ আসে না। আদায়, ক্রয় ও খরচের সময় মিলিয়ে দেখুন। দিন শেষে ক্যাশ গণনা করলে ঘাটতি ধরা পড়ে।',
    'Credit sales count as revenue but not cash. Track collections, purchases and expenses timing. Day-end cash count reveals gaps.',
    'ক্যাশ',
    2,
  ),
  article(
    'learn-dayclose',
    ['*'],
    'দিন শেষের অভ্যাস',
    'Day-close habit',
    'প্রতিদিন ৫ মিনিটে হিসাব মিলিয়ে নিন',
    'Reconcile accounts in 5 minutes daily',
    'দোকান বন্ধের আগে ক্যাশ গণনা করুন। অ্যাপের প্রত্যাশিত ক্যাশের সাথে মিলিয়ে পার্থক্য খুঁজুন। ছোট ভুল আগে ধরলে বড় সমস্যা হয় না।',
    'Count cash before closing. Match expected cash in the app. Small errors caught early prevent big problems.',
    'হিসাব',
    3,
  ),
  article(
    'learn-grocery-expiry',
    ['grocery', 'pharmacy'],
    'মেয়াদোত্তীর্ণ পণ্য এড়ান',
    'Avoid expired stock',
    'পুরনো স্টক আগে বিক্রি করুন (FIFO)',
    'Sell older stock first (FIFO)',
    'তারিখ দেখে সাজান — যা আগে শেষ হবে সামনে রাখুন। সাপ্তাহিক একবার মেয়াদ চেক করুন। কম স্টক সতর্কতা চালু রাখুন।',
    'Arrange by expiry date. Check weekly. Enable low-stock alerts.',
    'স্টক',
    10,
    true,
  ),
  article(
    'learn-grocery-margin',
    ['grocery', 'wholesale'],
    'মুদি দোকানের মার্জিন',
    'Grocery margins',
    'দ্রুত চলা পণ্যে কম, ধীরে চলায় বেশি মার্জিন',
    'Lower margin on fast movers, higher on slow items',
    'চাল, তেল, ডালে প্রতিযোগিতা বেশি — মার্জিন কম রাখুন। মসলা, স্ন্যাকসে সামান্য বেশি রাখতে পারেন। ক্রয় দাম বাড়লে বিক্রি দাম সময়মতো আপডেট করুন।',
    'Competitive items need tight margins. Spices and snacks can carry more. Update prices when purchase cost rises.',
    'মূল্য',
    11,
  ),
  article(
    'learn-pharmacy-license',
    ['pharmacy'],
    'ফার্মেসি: লাইসেন্স ও রেকর্ড',
    'Pharmacy: license and records',
    'ওষুধের ক্রয়-বিক্রি রেকর্ড রাখুন',
    'Keep medicine purchase-sale records',
    'প্রতিটি ওষুধের ব্যাচ নম্বর ও মেয়াদ লিখে রাখুন। নিয়মিত ইনভেন্টরি মিলান। বাকি খদ্দেরকে আলাদা ট্র্যাক করুন।',
    'Record batch numbers and expiry. Reconcile inventory regularly. Track dealer credit separately.',
    'নিয়ম',
    12,
    true,
  ),
  article(
    'learn-food-hygiene',
    ['food'],
    'খাবার দোকান: হাইজিন ও মূল্য',
    'Food shop: hygiene and pricing',
    'খরচ + ৩০–৪০% মার্জিন ধরে মূল্য নির্ধারণ',
    'Price at cost + 30–40% margin',
    'কাঁচামালের দাম ও নষ্ট হওয়া হিসাব করুন। প্যাকেজিং ও গ্যাস খরচ যোগ করুন। সিজনে দাম বদলালে মেনু আপডেট করুন।',
    'Factor raw material waste, packaging and fuel. Update menu when seasonal prices shift.',
    'মূল্য',
    20,
  ),
  article(
    'learn-garment-season',
    ['garment'],
    'কাপড়: সিজনাল স্টক',
    'Garments: seasonal stock',
    'ঈদ-সিজনে আগে স্টক, পরে ছাড়',
    'Stock early for Eid, discount after',
    'সিজনের ৬–৮ সপ্তাহ আগে ক্রয় শুরু করুন। সিজন শেষে বাকি স্টক ছাড় দিয়ে ক্যাশ তুলুন। রঙ ও সাইজ ভিত্তিতে বিক্রি ট্র্যাক করুন।',
    'Buy 6–8 weeks before peak season. Clear leftover stock with discounts. Track sales by color and size.',
    'স্টক',
    21,
    true,
  ),
  article(
    'learn-electronics-warranty',
    ['electronics'],
    'ইলেকট্রনিক্স: ওয়ারেন্টি কার্ড',
    'Electronics: warranty cards',
    'বিক্রির সময় সিরিয়াল ও ওয়ারেন্টি লিখুন',
    'Record serial and warranty at sale',
    'গ্রাহকের নাম, ফোন ও পণ্যের সিরিয়াল নোটে রাখুন। সাপ্লায়ারের বাকি আলাদা খাতায় দেখুন।',
    'Save customer phone and serial in notes. Track supplier credit in dealer khata.',
    'বিক্রি',
    22,
  ),
  article(
    'learn-hardware-credit',
    ['hardware', 'wholesale'],
    'হার্ডওয়্যার: ঠিকাদার বাকি',
    'Hardware: contractor credit',
    'বড় বাকিতে লিখিত নোট রাখুন',
    'Written note for large credit',
    'ঠিকাদার বা নির্মাণ সাইটে বাকি দিলে তারিখ ও পরিমাণ নোট করুন। সপ্তাহে একবার আদায় ফোন করুন।',
    'Log date and amount for site credit. Call weekly for collection.',
    'খাতা',
    23,
  ),
  article(
    'learn-salon-appointment',
    ['salon', 'services'],
    'সেলুন: পিক আওয়ার মূল্য',
    'Salon: peak-hour pricing',
    'ভিড়ের সময় সেবার দাম আলাদা রাখতে পারেন',
    'Different pricing at busy hours',
    'শুক্র-শনি বিকেলে চাহিদা বেশি। প্যাকেজ অফার দিয়ে নিয়মিত গ্রাহক ধরে রাখুন। স্টাফ কমিশন আলাদা হিসাব করুন।',
    'Fri-Sat evenings are peak. Use packages for regulars. Track staff commission separately.',
    'মূল্য',
    24,
  ),
  article(
    'learn-auto-parts',
    ['automotive'],
    'গ্যারেজ: পার্টস স্টক',
    'Garage: parts inventory',
    'দ্রুত চলা পার্টস সবসময় রাখুন',
    'Stock fast-moving parts',
    'অয়েল ফিল্টার, ব্রেক প্যাড মতো পার্টসের মিনিমাম স্টক ঠিক করুন। ডিলার থেকে বাকি ক্রয় কম রাখুন।',
    'Set minimum stock for filters and pads. Limit dealer credit purchases.',
    'স্টক',
    25,
  ),
  article(
    'learn-agri-season',
    ['agriculture'],
    'কৃষি: মৌসুমি ক্রয়',
    'Agriculture: seasonal buying',
    'বীজ-সার কেনার সময় মূল্য তুলনা করুন',
    'Compare seed-fertilizer prices seasonally',
    'মৌসুম শুরুর আগে ক্রয় করলে দাম কম পড়ে। বাকিতে নিলে সুদ হিসাবে রাখুন।',
    'Buy before season for lower prices. Factor interest on credit.',
    'ক্রয়',
    26,
  ),
  article(
    'learn-ecommerce-delivery',
    ['ecommerce'],
    'অনলাইন: ডেলিভারি খরচ',
    'Online: delivery costs',
    'ডেলিভারি চার্জ পণ্যের দামে যোগ করুন',
    'Include delivery in product price',
    'কুরিয়ার ও রিটার্ন খরচ হিসাব করুন। অগ্রিম পেমেন্ট নিলে বাকি ঝুঁকি কমে।',
    'Account for courier and returns. Advance payment reduces credit risk.',
    'অনলাইন',
    27,
    true,
  ),
  article(
    'learn-wholesale-volume',
    ['wholesale'],
    'পাইকারি: ভলিউম ডিসকাউন্ট',
    'Wholesale: volume discount',
    'বড় অর্ডারে স্ল্যাব ডিসকাউন্ট দিন',
    'Slab discounts for bulk orders',
    'ন্যূনতম অর্ডার পরিমাণ ঠিক করুন। বাকি সীমা ডিলার প্রতি আলাদা রাখুন।',
    'Set minimum order quantity. Per-dealer credit limits.',
    'বিক্রি',
    28,
  ),
  article(
    'learn-loan-kisti',
    ['*'],
    'কিস্তি সময়মতো দিন',
    'Pay installments on time',
    'ব্যাংক বা MFI কিস্তি মিস করলে জরিমানা',
    'Missing bank/MFI installments incurs penalties',
    'কিস্তির তারিখ ক্যালেন্ডারে মার্ক করুন। দোকানের ক্যাশ থেকে আলাদা রাখুন।',
    'Mark installment dates on calendar. Keep separate from shop cash.',
    'লোন',
    30,
  ),
];

export function filterLearningArticles(
  articles: LearningItem[],
  businessType: BusinessType,
): LearningItem[] {
  return articles
    .filter((a) => {
      const tags = a.business_types;
      if (!tags || tags.length === 0) return true;
      if (tags.includes('*')) return true;
      return tags.includes(businessType);
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function toLearningItems(seeds: LearningArticleSeed[]): LearningItem[] {
  return seeds as LearningItem[];
}
