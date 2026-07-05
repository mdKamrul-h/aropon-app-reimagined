/** Bilingual templates keyed per spec §8.6 — used by mock payload and future API rendering. */

export const SCORING_REASON_STRINGS: Record<
  string,
  { bn: string; en: string }
> = {
  RF_ARREARS_ACTIVE: {
    bn: 'আপনার একটি কিস্তি বকেয়া আছে ({dpd} দিন)। এটি পরিশোধ করলে আপনার স্কোর দ্রুত বাড়বে।',
    en: 'You have an overdue installment ({dpd} days). Clearing it is the fastest way to raise your score.',
  },
  RF_DSCR_UNSERVICEABLE: {
    bn: 'বর্তমান নগদ প্রবাহে কিস্তি পরিশোধ করা কঠিন — ঝুঁকি সতর্কতা।',
    en: 'Current cash flow cannot comfortably service installments — risk warning.',
  },
  RF_OVERINDEBTED: {
    bn: 'বহু সক্রিয় ঋণ বা অতিরিক্ত দেনা — সীমা কমানোর পরামর্শ।',
    en: 'Multiple active loans or high external debt — limit reduction advised.',
  },
  RF_THIN_MARGIN: {
    bn: 'খরচের অনুপাত খুব বেশি — লাভের মার্জিন চাপে।',
    en: 'Expense ratio is very high — profit margin under pressure.',
  },
  RF_VOLATILE_REVENUE: {
    bn: 'আয় অস্থির — মাসিক ওঠানামা বেশি।',
    en: 'Revenue is volatile — high month-to-month swings.',
  },
  RF_THIN_FILE: {
    bn: 'ডেটা কম — স্কোর এখনও গড়ে উঠছে।',
    en: 'Limited data — score is still building.',
  },
  RF_EXPENSE_DISCIPLINE: {
    bn: 'খরচের অনুশাসন দুর্বল — অনেক পয়েন্ট হারিয়েছেন।',
    en: 'Weak expense discipline — significant points left on the table.',
  },
  RF_LEAD_CONVERSION: {
    bn: 'বিক্রি রূপান্তর কম — সম্ভাব্য গ্রাহক হারাচ্ছেন।',
    en: 'Low lead conversion — potential customers not closing.',
  },
  RF_INVENTORY_TURNOVER: {
    bn: 'স্টক ধীরে চলছে — মূলধন আটকে আছে।',
    en: 'Inventory moving slowly — capital tied up in stock.',
  },
  GF_SPOTLESS_REPAY: {
    bn: 'নিখুঁত পরিশোধ — বর্তমানে কোনো বকেয়া নেই।',
    en: 'Spotless repayment — no current arrears.',
  },
  GF_STRONG_DSCR: {
    bn: 'শক্তিশালী নগদ সুরক্ষা — DSCR {dscr}।',
    en: 'Strong cash cushion — DSCR {dscr}.',
  },
  GF_ADHERENCE: {
    bn: 'সময়মতো কিস্তি পরিশোধ — ১০০% সম্মতি।',
    en: 'On-time installments — 100% schedule adherence.',
  },
  LV_EXPENSE_DISCIPLINE: {
    bn: 'খরচের অনুপাত কমালে প্রায় {pts} পয়েন্ট যোগ হবে।',
    en: 'Lowering your expense ratio would add about {pts} points.',
  },
  LV_LEAD_CONVERSION: {
    bn: 'বিক্রি রূপান্তর বাড়ালে প্রায় {pts} পয়েন্ট যোগ হবে।',
    en: 'Improving lead conversion would add about {pts} points.',
  },
  LV_INVENTORY_TURNOVER: {
    bn: 'স্টক দ্রুত ঘুরালে প্রায় {pts} পয়েন্ট যোগ হবে।',
    en: 'Faster inventory turnover would add about {pts} points.',
  },
  DEC_DSCR_BINDING: {
    bn: 'স্কোর অনুযায়ী আপনি আরও বেশি পেতে পারতেন, তবে নিরাপদ পরিশোধের জন্য আমরা আপনার ক্যাশ ফ্লো অনুযায়ী সীমা নির্ধারণ করেছি।',
    en: 'You qualify for more by score, but we sized this to your cash flow to keep repayment safe.',
  },
  DEC_APPROVE_STEPUP: {
    bn: 'নবায়ন / পরিমিত বৃদ্ধির জন্য অনুমোদিত',
    en: 'Approved for renewal / measured step-up',
  },
  DELTA_UP: {
    bn: 'স্কোর বেড়েছে',
    en: 'Score increased',
  },
  DELTA_ON_TIME: {
    bn: 'সময়মতো কিস্তি পরিশোধ +১২',
    en: 'On-time rate +12 (3 installments paid on time)',
  },
  DELTA_DSCR: {
    bn: 'ক্যাশ ফ্লো কভারেজ +৯ (DSCR ১.৯৩)',
    en: 'Cash-flow coverage +9 (DSCR rose to 1.93)',
  },
  DELTA_INVENTORY: {
    bn: 'স্টক টার্নওভার −৩ (এই মাসে ধীর)',
    en: 'Inventory turnover −3 (stock moved slower this month)',
  },
};

export function fillReasonTemplate(
  key: string,
  vars: Record<string, string | number> = {},
): { bn: string; en: string } {
  const entry = SCORING_REASON_STRINGS[key];
  if (!entry) return { bn: key, en: key };
  const replace = (s: string) =>
    Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
      s,
    );
  return { bn: replace(entry.bn), en: replace(entry.en) };
}

export function fillReasonText(
  key: string,
  vars: Record<string, string | number> = {},
): { text_bn: string; text_en: string } {
  const { bn, en } = fillReasonTemplate(key, vars);
  return { text_bn: bn, text_en: en };
}

export function fillVerdictText(
  key: string,
  vars: Record<string, string | number> = {},
): { verdict_bn: string; verdict_en: string } {
  const { bn, en } = fillReasonTemplate(key, vars);
  return { verdict_bn: bn, verdict_en: en };
}
