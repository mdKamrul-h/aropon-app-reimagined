import type { CreditScoreSummary } from '@/types/creditScore';
import { fillReasonText, fillVerdictText } from '@/constants/scoringReasonStrings';

/** Golden example from spec §16 — demo payload until scoring API ships. */
export const MOCK_CREDIT_SCORE_SUMMARY: CreditScoreSummary = {
  score: 730,
  band: {
    name: 'Good',
    color: 'teal',
    label_bn: 'ভালো',
    label_en: 'Good',
  },
  confidence: 'verified',
  percentile: 78,
  delta: {
    value: 18,
    previous_score: 712,
    sentence_key: 'DELTA_UP',
    sentence_bn: 'স্কোর +১৮ (৭১২ → ৭৩০)। সময়মতো কিস্তি ও শক্তিশালী ক্যাশ ফ্লো সাহায্য করেছে।',
    sentence_en: 'Score +18 (712 → 730). On-time payments and stronger cash flow helped.',
    drivers: [
      {
        message_key: 'DELTA_ON_TIME',
        direction: 'up',
        ...fillReasonText('DELTA_ON_TIME'),
      },
      {
        message_key: 'DELTA_DSCR',
        direction: 'up',
        ...fillReasonText('DELTA_DSCR'),
      },
      {
        message_key: 'DELTA_INVENTORY',
        direction: 'down',
        ...fillReasonText('DELTA_INVENTORY'),
      },
    ],
  },
  green_flags: [
    {
      message_key: 'GF_SPOTLESS_REPAY',
      ...fillReasonText('GF_SPOTLESS_REPAY'),
    },
    {
      message_key: 'GF_STRONG_DSCR',
      ...fillReasonText('GF_STRONG_DSCR', { dscr: '1.93' }),
    },
    {
      message_key: 'GF_ADHERENCE',
      ...fillReasonText('GF_ADHERENCE'),
    },
  ],
  red_flags: [
    {
      message_key: 'RF_EXPENSE_DISCIPLINE',
      severity: 'high',
      ...fillReasonText('RF_EXPENSE_DISCIPLINE'),
    },
    {
      message_key: 'RF_LEAD_CONVERSION',
      severity: 'medium',
      ...fillReasonText('RF_LEAD_CONVERSION'),
    },
    {
      message_key: 'RF_INVENTORY_TURNOVER',
      severity: 'medium',
      ...fillReasonText('RF_INVENTORY_TURNOVER'),
    },
  ],
  recommendation: {
    verdict_key: 'DEC_APPROVE_STEPUP',
    ...fillVerdictText('DEC_APPROVE_STEPUP'),
    limit_bdt: 75000,
    binding_cap: 'band',
    binding_note_bn:
      'স্কোর অনুযায়ী ৳১,০০,০০০ পর্যন্ত যোগ্য, তবে জাগরন স্কিম ও ব্যান্ড ক্যাপ অনুযায়ী ৳৭৫,০০০ সুপারিশ করা হয়েছে।',
    binding_note_en:
      'Eligible up to BDT 100,000 by score; BDT 75,000 recommended per Jagoron scheme and band cap.',
    levers: [
      {
        message_key: 'LV_EXPENSE_DISCIPLINE',
        points: 24,
        ...fillReasonText('LV_EXPENSE_DISCIPLINE', { pts: 24 }),
      },
      {
        message_key: 'LV_LEAD_CONVERSION',
        points: 8,
        ...fillReasonText('LV_LEAD_CONVERSION', { pts: 8 }),
      },
      {
        message_key: 'LV_INVENTORY_TURNOVER',
        points: 6,
        ...fillReasonText('LV_INVENTORY_TURNOVER', { pts: 6 }),
      },
    ],
  },
};
