import type { Business, Loan, LoanPayment, ReportSummary } from '@/types/schema';
import type { CreditScoreSummary } from '@/types/creditScore';
import { onTimeRatePercent } from '@/lib/loans/installmentSchedule';
import { formatTaka } from '@/utils/bn-numerals';

function generatedOnLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The payoff of the whole app: one document a shopkeeper can hand to a
 * bank or MFI loan officer, bundling the real credit score, the real
 * P&L, and real per-loan repayment history — everything a lender would
 * otherwise have to ask for separately.
 */
export function buildLoanReadinessHtml(
  business: Business,
  report: ReportSummary,
  score: CreditScoreSummary,
  loans: Loan[],
  loanPaymentsByLoan: Record<string, LoanPayment[]>,
): string {
  const kyc = [
    business.address ? `<div><strong>ঠিকানা:</strong> ${business.address}</div>` : '',
    business.district ? `<div><strong>জেলা:</strong> ${business.district}</div>` : '',
    business.established_on ? `<div><strong>প্রতিষ্ঠার তারিখ:</strong> ${business.established_on}</div>` : '',
    business.trade_license_no ? `<div><strong>ট্রেড লাইসেন্স নং:</strong> ${business.trade_license_no}</div>` : '',
  ]
    .filter(Boolean)
    .join('');

  const loanRows = loans
    .filter((l) => l.principal > 0)
    .map((l) => {
      const payments = loanPaymentsByLoan[l.id] ?? [];
      const onTime = onTimeRatePercent(payments);
      return `<tr>
        <td>${l.lender_name}</td>
        <td>${l.loan_type}</td>
        <td>${formatTaka(l.principal)}</td>
        <td>${formatTaka(l.outstanding)}</td>
        <td>${onTime === null ? '—' : `${onTime}%`}</td>
        <td>${l.status === 'active' ? 'চলমান' : 'পরিশোধিত'}</td>
      </tr>`;
    })
    .join('');

  const greenFlagRows = score.green_flags.map((f) => `<li>${f.text_bn}</li>`).join('');
  const redFlagRows = score.red_flags.map((f) => `<li>${f.text_bn}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="utf-8"><title>${business.name} — ঋণ প্রস্তুতি প্রতিবেদন</title>
<style>
  body { font-family: sans-serif; padding: 24px; color: #083344; }
  h1 { color: #0e7490; margin-bottom: 4px; }
  h2 { color: #0e7490; margin-top: 28px; }
  .subtitle { color: #5f8a96; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #a3cad5; padding: 8px; text-align: left; }
  th { background: #ecfeff; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; }
  .card { background: #f0fdfa; padding: 12px 16px; border-radius: 12px; min-width: 120px; }
  .kyc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin: 16px 0; }
  .score-card { background: #ecfeff; border: 2px solid #0e7490; border-radius: 16px; padding: 20px; display: flex; gap: 24px; align-items: center; }
  .score-num { font-size: 48px; font-weight: bold; color: #0e7490; }
  .score-band { font-size: 18px; color: #083344; }
  ul { margin: 4px 0; padding-left: 20px; }
  .signature { display: flex; justify-content: space-between; margin-top: 64px; }
  .sig-line { border-top: 1px solid #083344; width: 220px; text-align: center; padding-top: 6px; }
</style>
</head>
<body>
  <h1>${business.name}</h1>
  <p class="subtitle">${business.owner_name} · ঋণ প্রস্তুতি প্রতিবেদন · তৈরির তারিখ: ${generatedOnLabel()}</p>
  <div class="kyc">${kyc || '<div>কোনো অতিরিক্ত ব্যবসায়িক তথ্য যোগ করা হয়নি।</div>'}</div>

  <h2>ক্রেডিট স্কোর</h2>
  <div class="score-card">
    <div class="score-num">${score.score}<span style="font-size:16px">/1000</span></div>
    <div>
      <div class="score-band">${score.band.label_bn} · ${score.confidence === 'verified' ? 'যাচাইকৃত' : score.confidence === 'building' ? 'গড়ে উঠছে' : 'প্রাথমিক'}</div>
      <div>উপরের ${score.percentile}% ব্যবসার মধ্যে</div>
      <div>প্রস্তাবিত ঋণসীমা: <strong>${formatTaka(score.recommendation.limit_bdt)}</strong></div>
    </div>
  </div>
  ${greenFlagRows ? `<h2>শক্তি</h2><ul>${greenFlagRows}</ul>` : ''}
  ${redFlagRows ? `<h2>উন্নতির সুযোগ</h2><ul>${redFlagRows}</ul>` : ''}

  <h2>ব্যবসার হিসাব সারাংশ</h2>
  <div class="summary">
    <div class="card"><strong>লাভ</strong><br>${formatTaka(report.profit)}</div>
    <div class="card"><strong>বিক্রি</strong><br>${formatTaka(report.sales)}</div>
    <div class="card"><strong>খরচ</strong><br>${formatTaka(report.expenses)}</div>
    <div class="card"><strong>মার্জিন</strong><br>${report.profitMargin}%</div>
    <div class="card"><strong>মোট পাবেন</strong><br>${formatTaka(report.totalReceivable)}</div>
  </div>

  ${loanRows ? `<h2>লোন ও পরিশোধ ইতিহাস</h2>
  <table>
    <tr><th>ঋণদাতা</th><th>ধরন</th><th>মূল</th><th>বকেয়া</th><th>সময়মতো পরিশোধ</th><th>অবস্থা</th></tr>
    ${loanRows}
  </table>` : '<h2>লোন ও পরিশোধ ইতিহাস</h2><p>বর্তমানে কোনো লোন নেই।</p>'}

  <div class="signature">
    <div class="sig-line">দোকান মালিকের স্বাক্ষর</div>
    <div class="sig-line">তারিখ</div>
  </div>
</body>
</html>`;
}
