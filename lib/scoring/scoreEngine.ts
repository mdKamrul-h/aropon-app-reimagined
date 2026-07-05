import type {
  Business,
  CreditBand,
  CreditScoreDriver,
  Installment,
  Loan,
  LoanPayment,
  Party,
  ScoreConfidence,
  Transaction,
} from '@/types/schema';
import type {
  CreditScoreBandColor,
  CreditScoreBandName,
  CreditScoreSummary,
} from '@/types/creditScore';
import { onTimeRatePercent } from '@/lib/loans/installmentSchedule';
import { todayISO } from '@/utils/bn-numerals';

/**
 * Transparent, rule-based scoring engine — every point traces back to the
 * shopkeeper's own transactions, receivables, and loan repayment history.
 * No black-box ML, no server round-trip: the same inputs always produce
 * the same, explainable score.
 *
 * Score is out of 1000, split across five weighted components. Each
 * component degrades gracefully to a neutral value (not a penalty) when
 * the relevant data doesn't exist yet — a brand-new shop isn't punished
 * for not having 90 days of history, it's just marked lower-confidence.
 */

const WEIGHTS = {
  repayment: 350,
  cashFlow: 250,
  revenueStability: 150,
  expenseDiscipline: 150,
  receivablesQuality: 100,
} as const;

function isCashMovement(t: Transaction): boolean {
  if (t.type === 'sale' || t.type === 'purchase') return !t.is_credit;
  return true;
}

function cashDelta(t: Transaction): number {
  if (!isCashMovement(t)) return 0;
  const inflow = t.type === 'sale' || t.type === 'payment_in';
  return inflow ? t.amount : -t.amount;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function daysAgo(iso: string): number {
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date(`${todayISO()}T12:00:00`);
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}

function monthBucket(t: Transaction, monthsAgo: number): boolean {
  const age = daysAgo(t.transaction_date);
  return age >= monthsAgo * 30 && age < (monthsAgo + 1) * 30;
}

export interface ScoreComponent {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
}

export interface ScoreEngineInput {
  business: Business;
  transactions: Transaction[];
  parties: Party[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  installmentsByLoan: Record<string, Installment[]>;
}

export interface ScoreEngineResult {
  score: number;
  band: CreditBand;
  confidence: ScoreConfidence;
  dscr: number | null;
  components: ScoreComponent[];
  summary: CreditScoreSummary;
}

const BAND_META: Record<
  CreditBand,
  { name: CreditScoreBandName; color: CreditScoreBandColor; label_bn: string; label_en: string }
> = {
  excellent: { name: 'Excellent', color: 'green', label_bn: 'চমৎকার', label_en: 'Excellent' },
  good: { name: 'Good', color: 'teal', label_bn: 'ভালো', label_en: 'Good' },
  fair: { name: 'Fair', color: 'amber', label_bn: 'মোটামুটি', label_en: 'Fair' },
  poor: { name: 'Poor', color: 'orange', label_bn: 'দুর্বল', label_en: 'Poor' },
  very_poor: { name: 'Very Poor', color: 'red', label_bn: 'খুবই দুর্বল', label_en: 'Very Poor' },
};

function bandFromScore(score: number): CreditBand {
  if (score >= 800) return 'excellent';
  if (score >= 650) return 'good';
  if (score >= 500) return 'fair';
  if (score >= 350) return 'poor';
  return 'very_poor';
}

function scoreRepayment(loans: Loan[], payments: LoanPayment[]): { component: ScoreComponent; hasArrears: boolean } {
  const max = WEIGHTS.repayment;
  if (loans.length === 0) {
    return {
      component: { key: 'repayment', label: 'পরিশোধ ইতিহাস', points: Math.round(max * 0.7), maxPoints: max },
      hasArrears: false,
    };
  }
  if (payments.length === 0) {
    return {
      component: { key: 'repayment', label: 'পরিশোধ ইতিহাস', points: Math.round(max * 0.65), maxPoints: max },
      hasArrears: false,
    };
  }
  const onTime = onTimeRatePercent(payments) ?? 100;
  const hasArrears = loans.some((l) => l.status === 'active' && l.next_due_date && l.next_due_date < todayISO());
  let points = Math.round((onTime / 100) * max);
  if (hasArrears) points = Math.max(0, points - Math.round(max * 0.25));
  return { component: { key: 'repayment', label: 'পরিশোধ ইতিহাস', points, maxPoints: max }, hasArrears };
}

function scoreCashFlow(
  transactions: Transaction[],
  loans: Loan[],
  installmentsByLoan: Record<string, Installment[]>,
): { component: ScoreComponent; dscr: number | null } {
  const max = WEIGHTS.cashFlow;
  const monthlyNet = [0, 1, 2].map((m) =>
    transactions.filter((t) => monthBucket(t, m)).reduce((s, t) => s + cashDelta(t), 0),
  );
  const avgMonthlyNet = monthlyNet.reduce((a, b) => a + b, 0) / 3;

  const monthlyDebtService = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => {
      const next = (installmentsByLoan[l.id] ?? []).find((i) => !i.is_paid);
      const amount = next?.amount ?? l.outstanding / Math.max(1, l.total_installments - l.paid_installments);
      const perMonth = l.frequency === 'weekly' ? amount * 4.33 : amount;
      return sum + perMonth;
    }, 0);

  if (monthlyDebtService <= 0) {
    return {
      component: { key: 'cashFlow', label: 'নগদ প্রবাহ কভারেজ (DSCR)', points: max, maxPoints: max },
      dscr: null,
    };
  }

  const dscr = avgMonthlyNet / monthlyDebtService;
  const points = Math.round(max * clamp((dscr - 0.8) / (2.0 - 0.8), 0, 1));
  return { component: { key: 'cashFlow', label: 'নগদ প্রবাহ কভারেজ (DSCR)', points, maxPoints: max }, dscr };
}

function scoreRevenueStability(transactions: Transaction[]): ScoreComponent {
  const max = WEIGHTS.revenueStability;
  const monthlySales = [0, 1, 2, 3, 4, 5].map((m) =>
    transactions.filter((t) => t.type === 'sale' && monthBucket(t, m)).reduce((s, t) => s + t.amount, 0),
  );
  const monthsWithData = monthlySales.filter((v) => v > 0).length;
  if (monthsWithData < 2) {
    return { key: 'revenueStability', label: 'আয়ের স্থিতিশীলতা', points: Math.round(max * 0.6), maxPoints: max };
  }
  const mean = monthlySales.reduce((a, b) => a + b, 0) / monthlySales.length;
  const variance = monthlySales.reduce((s, v) => s + (v - mean) ** 2, 0) / monthlySales.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const points = Math.round(max * clamp(1 - cv, 0, 1));
  return { key: 'revenueStability', label: 'আয়ের স্থিতিশীলতা', points, maxPoints: max };
}

function scoreExpenseDiscipline(transactions: Transaction[]): ScoreComponent {
  const max = WEIGHTS.expenseDiscipline;
  const recent = transactions.filter((t) => daysAgo(t.transaction_date) <= 90);
  const sales = recent.filter((t) => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
  const expenses = recent.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (sales <= 0) {
    return { key: 'expenseDiscipline', label: 'খরচের অনুশাসন', points: Math.round(max * 0.5), maxPoints: max };
  }
  const ratio = expenses / sales;
  const points = Math.round(max * clamp((0.7 - ratio) / (0.7 - 0.3), 0, 1));
  return { key: 'expenseDiscipline', label: 'খরচের অনুশাসন', points, maxPoints: max };
}

function scoreReceivablesQuality(parties: Party[]): ScoreComponent {
  const max = WEIGHTS.receivablesQuality;
  const receivable = parties.filter((p) => p.type === 'customer' && p.balance > 0);
  const totalReceivable = receivable.reduce((s, p) => s + p.balance, 0);
  if (totalReceivable <= 0) {
    return { key: 'receivablesQuality', label: 'বাকির মান', points: max, maxPoints: max };
  }
  const overdue60 = receivable
    .filter((p) => daysAgo(p.last_activity_at ?? todayISO()) > 60)
    .reduce((s, p) => s + p.balance, 0);
  const share = overdue60 / totalReceivable;
  const points = Math.round(max * (1 - share));
  return { key: 'receivablesQuality', label: 'বাকির মান', points, maxPoints: max };
}

function confidenceFor(transactions: Transaction[], loans: Loan[], payments: LoanPayment[]): ScoreConfidence {
  const oldestTxDays = transactions.reduce(
    (max, t) => Math.max(max, daysAgo(t.transaction_date)),
    0,
  );
  if (oldestTxDays < 30) return 'preliminary';
  if (loans.length > 0 && payments.length === 0) return 'building';
  if (oldestTxDays < 90) return 'building';
  return 'verified';
}

export function computeCreditScore(
  input: ScoreEngineInput,
  previousDrivers: CreditScoreDriver[] = [],
): ScoreEngineResult {
  const { transactions, parties, loans, loanPayments, installmentsByLoan } = input;

  const repayment = scoreRepayment(loans, loanPayments);
  const cashFlow = scoreCashFlow(transactions, loans, installmentsByLoan);
  const revenueStability = scoreRevenueStability(transactions);
  const expenseDiscipline = scoreExpenseDiscipline(transactions);
  const receivablesQuality = scoreReceivablesQuality(parties);

  const components = [
    repayment.component,
    cashFlow.component,
    revenueStability,
    expenseDiscipline,
    receivablesQuality,
  ];
  const score = clamp(components.reduce((s, c) => s + c.points, 0), 0, 1000);
  const bandKey = bandFromScore(score);
  const band = BAND_META[bandKey];
  const confidence = confidenceFor(transactions, loans, loanPayments);
  const percentile = clamp(Math.round((score / 1000) * 100), 1, 99);

  const driverMap = new Map(previousDrivers.map((d) => [d.key, d.impact]));
  const deltaDrivers = components
    .map((c) => {
      const prev = driverMap.get(c.key);
      if (prev === undefined) return null;
      const diff = c.points - prev;
      if (diff === 0) return null;
      return {
        message_key: `DELTA_${c.key.toUpperCase()}`,
        direction: (diff > 0 ? 'up' : 'down') as 'up' | 'down',
        text_bn: `${c.label} ${diff > 0 ? '+' : ''}${diff}`,
        text_en: `${c.label} ${diff > 0 ? '+' : ''}${diff}`,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);
  const previousScore = previousDrivers.length > 0
    ? previousDrivers.reduce((s, d) => s + d.impact, 0)
    : null;
  const deltaValue = previousScore !== null ? score - previousScore : 0;

  const greenFlags: CreditScoreSummary['green_flags'] = [];
  const redFlags: CreditScoreSummary['red_flags'] = [];

  if (repayment.hasArrears) {
    redFlags.push({
      message_key: 'RF_ARREARS_ACTIVE',
      severity: 'critical',
      text_bn: 'আপনার একটি কিস্তি বকেয়া আছে। এটি পরিশোধ করলে আপনার স্কোর দ্রুত বাড়বে।',
      text_en: 'You have an overdue installment. Clearing it is the fastest way to raise your score.',
    });
  } else if (loanPayments.length > 0) {
    greenFlags.push({
      message_key: 'GF_SPOTLESS_REPAY',
      text_bn: 'নিখুঁত পরিশোধ — বর্তমানে কোনো বকেয়া নেই।',
      text_en: 'Spotless repayment — no current arrears.',
    });
  }

  if (cashFlow.dscr !== null && cashFlow.dscr < 1) {
    redFlags.push({
      message_key: 'RF_DSCR_UNSERVICEABLE',
      severity: 'high',
      text_bn: 'বর্তমান নগদ প্রবাহে কিস্তি পরিশোধ করা কঠিন — ঝুঁকি সতর্কতা।',
      text_en: 'Current cash flow cannot comfortably service installments — risk warning.',
    });
  } else if (cashFlow.dscr !== null && cashFlow.dscr >= 1.5) {
    greenFlags.push({
      message_key: 'GF_STRONG_DSCR',
      text_bn: `শক্তিশালী নগদ সুরক্ষা — DSCR ${cashFlow.dscr.toFixed(2)}।`,
      text_en: `Strong cash cushion — DSCR ${cashFlow.dscr.toFixed(2)}.`,
    });
  }

  if (expenseDiscipline.points / expenseDiscipline.maxPoints < 0.4) {
    redFlags.push({
      message_key: 'RF_THIN_MARGIN',
      severity: 'medium',
      text_bn: 'খরচের অনুপাত খুব বেশি — লাভের মার্জিন চাপে।',
      text_en: 'Expense ratio is very high — profit margin under pressure.',
    });
  }

  if (revenueStability.points / revenueStability.maxPoints < 0.4) {
    redFlags.push({
      message_key: 'RF_VOLATILE_REVENUE',
      severity: 'medium',
      text_bn: 'আয় অস্থির — মাসিক ওঠানামা বেশি।',
      text_en: 'Revenue is volatile — high month-to-month swings.',
    });
  }

  if (confidence === 'preliminary') {
    redFlags.push({
      message_key: 'RF_THIN_FILE',
      severity: 'low',
      text_bn: 'ডেটা কম — স্কোর এখনও গড়ে উঠছে।',
      text_en: 'Limited data — score is still building.',
    });
  }

  if (receivablesQuality.points === receivablesQuality.maxPoints && receivablesQuality.points > 0) {
    greenFlags.push({
      message_key: 'GF_RECEIVABLES_HEALTHY',
      text_bn: 'বাকি আদায় স্বাস্থ্যকর — ৬০ দিনের বেশি পুরনো বাকি নেই।',
      text_en: 'Healthy receivables — nothing overdue past 60 days.',
    });
  }

  const levers = components
    .filter((c) => c.points < c.maxPoints * 0.8)
    .sort((a, b) => a.points / a.maxPoints - b.points / b.maxPoints)
    .slice(0, 3)
    .map((c) => {
      const gap = Math.round((c.maxPoints - c.points) * 0.4);
      return {
        message_key: `LV_${c.key.toUpperCase()}`,
        points: gap,
        text_bn: `${c.label} উন্নত করলে প্রায় ${gap} পয়েন্ট যোগ হবে।`,
        text_en: `Improving ${c.label.toLowerCase()} would add about ${gap} points.`,
      };
    });

  const monthlyNetCashFlow =
    transactions.filter((t) => daysAgo(t.transaction_date) <= 30).reduce((s, t) => s + cashDelta(t), 0);
  const rawLimit = clamp(monthlyNetCashFlow * 3, 5000, 500000);
  const bandCapMultiplier = { excellent: 1, good: 0.75, fair: 0.5, poor: 0.25, very_poor: 0.1 }[bandKey];
  const bandCappedLimit = rawLimit * bandCapMultiplier;
  const dscrCapped = cashFlow.dscr !== null && cashFlow.dscr < 1.2;
  const limit = Math.round((dscrCapped ? bandCappedLimit * 0.6 : bandCappedLimit) / 500) * 500;

  const verdictKey =
    bandKey === 'excellent' || bandKey === 'good'
      ? 'DEC_APPROVE_STEPUP'
      : bandKey === 'fair'
        ? 'DEC_APPROVE_MONITOR'
        : 'DEC_NEEDS_IMPROVEMENT';
  const verdictText = {
    DEC_APPROVE_STEPUP: {
      bn: 'নবায়ন / পরিমিত বৃদ্ধির জন্য অনুমোদিত',
      en: 'Approved for renewal / measured step-up',
    },
    DEC_APPROVE_MONITOR: {
      bn: 'পর্যবেক্ষণসহ অনুমোদিত',
      en: 'Approved with monitoring',
    },
    DEC_NEEDS_IMPROVEMENT: {
      bn: 'বর্তমানে সুপারিশ করা হয়নি — নিচের উপায়গুলো অনুসরণ করুন',
      en: 'Not currently recommended — follow the levers below',
    },
  }[verdictKey];

  const summary: CreditScoreSummary = {
    score,
    band,
    confidence,
    percentile,
    delta: {
      value: deltaValue,
      previous_score: previousScore ?? undefined,
      sentence_key: deltaValue >= 0 ? 'DELTA_UP' : 'DELTA_DOWN',
      sentence_bn:
        previousScore === null
          ? 'এটি আপনার প্রথম স্কোর।'
          : `স্কোর ${deltaValue >= 0 ? '+' : ''}${deltaValue} (${previousScore} → ${score})।`,
      sentence_en:
        previousScore === null
          ? 'This is your first score.'
          : `Score ${deltaValue >= 0 ? '+' : ''}${deltaValue} (${previousScore} → ${score}).`,
      drivers: deltaDrivers,
    },
    green_flags: greenFlags,
    red_flags: redFlags,
    recommendation: {
      verdict_key: verdictKey,
      verdict_bn: verdictText.bn,
      verdict_en: verdictText.en,
      limit_bdt: Math.max(0, limit),
      binding_cap: dscrCapped ? 'dscr' : 'band',
      binding_note_bn: dscrCapped
        ? 'আপনার নগদ প্রবাহ অনুযায়ী সীমা সংকুচিত করা হয়েছে যাতে নিরাপদে পরিশোধ করা যায়।'
        : `${band.label_bn} ব্যান্ড অনুযায়ী সীমা নির্ধারণ করা হয়েছে।`,
      binding_note_en: dscrCapped
        ? 'Limit narrowed to your cash flow to keep repayment safe.'
        : `Limit sized to the ${band.label_en} band.`,
      levers,
    },
  };

  return {
    score,
    band: bandKey,
    confidence,
    dscr: cashFlow.dscr,
    components,
    summary,
  };
}
