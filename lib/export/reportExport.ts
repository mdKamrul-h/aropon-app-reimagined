import type { ReportSummary } from '@/types/schema';
import { formatTaka } from '@/utils/bn-numerals';

export function buildReportCsv(report: ReportSummary, rangeLabel: string): string {
  const lines = [
    'আরোপন রিপোর্ট',
    `সময়কাল,${rangeLabel}`,
    '',
    'মেট্রিক,পরিমাণ',
    `লাভ,${report.profit}`,
    `বিক্রি,${report.sales}`,
    `ক্রয়,${report.purchases}`,
    `খরচ,${report.expenses}`,
    `আদায়,${report.collections}`,
    `লাভ মার্জিন,${report.profitMargin}%`,
    `মোট পাবেন,${report.totalReceivable}`,
    '',
    'তারিখ,বিক্রি',
    ...report.dailySales.map((d) => `${d.label},${d.amount}`),
    '',
    'খরচের ধরন,পরিমাণ',
    ...report.expenseBreakdown.map((e) => `${e.label},${e.amount}`),
    '',
    'গ্রাহক,ব্যালেন্স',
    ...report.topCustomers.map((c) => `${c.name},${c.amount}`),
  ];
  return lines.join('\n');
}

export function buildReportHtml(report: ReportSummary, rangeLabel: string, shopName: string): string {
  const expenseRows = report.expenseBreakdown
    .map((e) => `<tr><td>${e.label}</td><td>${formatTaka(e.amount)}</td></tr>`)
    .join('');
  const salesRows = report.dailySales
    .map((d) => `<tr><td>${d.label}</td><td>${formatTaka(d.amount)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="bn">
<head><meta charset="utf-8"><title>আরোপন রিপোর্ট</title>
<style>
  body { font-family: sans-serif; padding: 24px; color: #083344; }
  h1 { color: #0e7490; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #a3cad5; padding: 8px; text-align: left; }
  th { background: #ecfeff; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; }
  .card { background: #f0fdfa; padding: 12px 16px; border-radius: 12px; min-width: 120px; }
</style>
</head>
<body>
  <h1>${shopName} — রিপোর্ট</h1>
  <p>সময়কাল: ${rangeLabel}</p>
  <div class="summary">
    <div class="card"><strong>লাভ</strong><br>${formatTaka(report.profit)}</div>
    <div class="card"><strong>বিক্রি</strong><br>${formatTaka(report.sales)}</div>
    <div class="card"><strong>খরচ</strong><br>${formatTaka(report.expenses)}</div>
  </div>
  <h2>দৈনিক বিক্রি</h2>
  <table><tr><th>তারিখ</th><th>বিক্রি</th></tr>${salesRows}</table>
  <h2>খরচ বিভাজন</h2>
  <table><tr><th>ধরন</th><th>পরিমাণ</th></tr>${expenseRows}</table>
</body>
</html>`;
}
