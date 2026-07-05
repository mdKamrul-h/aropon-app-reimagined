import type { CreditScoreSummary } from '@/types/creditScore';
import { MOCK_CREDIT_SCORE_SUMMARY } from '@/constants/creditScoreMock';

/**
 * Fetches the mobile-facing credit score summary (spec §10).
 *
 * Today: returns static mock data from the §16 golden example.
 * Later: `GET /v1/score/{borrower_id}/summary` via Supabase edge function.
 */
export async function fetchCreditScoreSummary(
  _businessId: string,
): Promise<CreditScoreSummary> {
  // const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
  // const res = await fetch(`${base}/functions/v1/score/${businessId}/summary`);
  // return res.json();
  return { ...MOCK_CREDIT_SCORE_SUMMARY };
}
