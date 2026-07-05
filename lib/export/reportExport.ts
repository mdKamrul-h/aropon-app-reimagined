import type { Business, ReportSummary } from '@/types/schema';
import { BUSINESS_TYPE_OPTIONS } from '@/constants/onboarding';
import { formatTaka } from '@/utils/bn-numerals';

function businessTypeLabel(type: Business['business_type']): string {
  return BUSINESS_TYPE_OPTIONS.find((o) => o.key === type)?.label ?? type;
}

function generatedOnLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildReportCsv(report: ReportSummary, rangeLabel: string): string {
  const lines = [
    'আরোপন রিপোর্ট',
    `সময়কাল,${rangeLabel}`,
    `তৈরির তারিখ,${generatedOnLabel()}`,
    '',
    'মেট্রিক,পরিমাণ',
    `লাভ,${report.profit}`,
    `বিক্রি,${report.sales}`,
    `ক্রয়,${report.purchases}`,
    `খরচ,${report.expenses}`,
    `আদায়,${report.collections}`,
    `লাভ মার্জিন,${report.profitMargin}%`,
    `মোট পাবেন,${report.totalReceivable}`,
  ];

  if (report.grossMarginPercent !== null) {
    lines.push(
      `প্রকৃত গ্রস মার্জিন (পণ্য অনুযায়ী),${report.grossMarginPercent}%`,
      `- বিক্রয় (পণ্য-ভিত্তিক),${report.cogsSales}`,
      `- ক্রয়মূল্য (COGS),${report.cogs}`,
    );
  }

  lines.push(
    '',
    'তারিখ,বিক্রি',
    ...report.dailySales.map((d) => `${d.label},${d.amount}`),
    '',
    'খরচের ধরন,পরিমাণ',
    ...report.expenseBreakdown.map((e) => `${e.label},${e.amount}`),
    '',
    'বকেয়ার বয়স,পরিমাণ,সংখ্যা',
    ...report.receivablesAging.map((b) => `${b.bucket},${b.amount},${b.count}`),
    '',
    'গ্রাহক,ব্যালেন্স',
    ...report.topCustomers.map((c) => `${c.name},${c.amount}`),
  );

  return lines.join('\n');
}

/**
 * Lender-formatted statement: business identity/KYC cover, period, real
 * figures (including COGS margin and receivables aging when available),
 * and a signature block — meant to be handed to a bank/MFI loan officer,
 * not just a personal export.
 */
export function buildReportHtml(report: ReportSummary, rangeLabel: string, business: Business): string {
  const expenseRows = report.expenseBreakdown
    .map((e) => `<tr><td>${e.label}</td><td>${formatTaka(e.amount)}</td></tr>`)
    .join('');
  const salesRows = report.dailySales
    .map((d) => `<tr><td>${d.label}</td><td>${formatTaka(d.amount)}</td></tr>`)
    .join('');
  const agingRows = report.receivablesAging
    .map((b) => `<tr><td>${b.bucket}</td><td>${formatTaka(b.amount)}</td><td>${b.count}</td></tr>`)
    .join('');
  const debtorRows = report.topCustomers
    .map((c) => `<tr><td>${c.name}</td><td>${formatTaka(c.amount)}</td></tr>`)
    .join('');

  const kyc = [
    business.address ? `<div><strong>ঠিকানা:</strong> ${business.address}</div>` : '',
    business.district ? `<div><strong>জেলা:</strong> ${business.district}</div>` : '',
    business.established_on ? `<div><strong>প্রতিষ্ঠার তারিখ:</strong> ${business.established_on}</div>` : '',
    business.trade_license_no ? `<div><strong>ট্রেড লাইসেন্স নং:</strong> ${business.trade_license_no}</div>` : '',
  ]
    .filter(Boolean)
    .join('');

  const marginSection =
    report.grossMarginPercent !== null
      ? `<h2>প্রকৃত গ্রস মার্জিন (পণ্য অনুযায়ী)</h2>
         <p>${report.grossMarginPercent}% — বিক্রয় ${formatTaka(report.cogsSales)}, ক্রয়মূল্য (COGS) ${formatTaka(report.cogs)}
         <br><small>যেসব বিক্রিতে পণ্য বাছাই করা হয়েছিল, শুধু সেগুলোর ভিত্তিতে হিসাব করা হয়েছে।</small></p>`
      : '';

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="utf-8"><title>${business.name} — ঋণের জন্য রিপোর্ট</title>
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
  .signature { display: flex; justify-content: space-between; margin-top: 64px; }
  .sig-line { border-top: 1px solid #083344; width: 220px; text-align: center; padding-top: 6px; }
</style>
</head>
<body>
  <h1>${business.name}</h1>
  <p class="subtitle">
    ${business.owner_name} · ${businessTypeLabel(business.business_type)}
  </p>
  <div class="kyc">
    <div><strong>প্রতিবেদনের সময়কাল:</strong> ${rangeLabel}</div>
    <div><strong>তৈরির তারিখ:</strong> ${generatedOnLabel()}</div>
    ${kyc}
  </div>

  <div class="summary">
    <div class="card"><strong>লাভ</strong><br>${formatTaka(report.profit)}</div>
    <div class="card"><strong>বিক্রি</strong><br>${formatTaka(report.sales)}</div>
    <div class="card"><strong>খরচ</strong><br>${formatTaka(report.expenses)}</div>
    <div class="card"><strong>মার্জিন</strong><br>${report.profitMargin}%</div>
    <div class="card"><strong>মোট পাবেন</strong><br>${formatTaka(report.totalReceivable)}</div>
  </div>

  ${marginSection}

  <h2>দৈনিক বিক্রি</h2>
  <table><tr><th>তারিখ</th><th>বিক্রি</th></tr>${salesRows}</table>

  <h2>খরচ বিভাজন</h2>
  <table><tr><th>ধরন</th><th>পরিমাণ</th></tr>${expenseRows}</table>

  ${agingRows ? `<h2>বকেয়ার বয়স</h2><table><tr><th>মেয়াদ</th><th>পরিমাণ</th><th>সংখ্যা</th></tr>${agingRows}</table>` : ''}

  ${debtorRows ? `<h2>শীর্ষ বকেয়া (গ্রাহক)</h2><table><tr><th>নাম</th><th>বকেয়া</th></tr>${debtorRows}</table>` : ''}

  <div class="signature">
    <div class="sig-line">দোকান মালিকের স্বাক্ষর</div>
    <div class="sig-line">তারিখ</div>
  </div>
</body>
</html>`;
}
