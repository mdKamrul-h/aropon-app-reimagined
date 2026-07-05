import type {
  DashboardSummary,
  Loan,
  Party,
  PaymentMethod,
  Product,
  ReportSummary,
  Transaction,
} from '@/types/schema';
import { todayISO } from '@/utils/bn-numerals';

const EXPENSE_COLORS = ['#D32F2F', '#0A6EB4', '#F9A825', '#8B5CF6', '#2E7D32', '#6A1B9A'];
const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  cash: '#16b886',
  bkash: '#E2136E',
  nagad: '#F6921E',
  rocket: '#8B2FC9',
  card: '#0e7490',
};
const BN_DAY_LABELS = ['র', 'শ', 'ম', 'ব', 'বু', 'বৃ', 'শু'] as const;

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function bnDayLabel(isoDate: string): string {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return BN_DAY_LABELS[day] ?? isoDate.slice(5);
}

function sumType(txs: Transaction[], type: Transaction['type']) {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

function profitBetween(
  transactions: Transaction[],
  businessId: string,
  startInclusive: string,
  endExclusive: string,
): number {
  const txs = transactions.filter(
    (t) =>
      t.business_id === businessId &&
      !t.deleted_at &&
      t.transaction_date >= startInclusive &&
      t.transaction_date < endExclusive,
  );
  const sales = sumType(txs, 'sale');
  const purchases = sumType(txs, 'purchase');
  const expenses = sumType(txs, 'expense');
  return sales - purchases - expenses;
}

export function buildDashboard(
  cashInHand: number,
  parties: Party[],
  products: Product[],
  transactions: Transaction[],
  loans: Loan[],
  businessId: string,
): DashboardSummary {
  const bizParties = parties.filter((p) => p.business_id === businessId && !p.deleted_at);
  const receivable = bizParties.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const payable = bizParties
    .filter((p) => p.balance < 0)
    .reduce((s, p) => s + Math.abs(p.balance), 0);

  const today = todayISO();
  const txs = transactions.filter(
    (t) => t.business_id === businessId && !t.deleted_at && t.transaction_date === today,
  );
  const sum = (type: Transaction['type']) =>
    txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const bizProducts = products.filter((p) => p.business_id === businessId && !p.deleted_at);
  const lowStock = bizProducts.filter((p) => p.qty <= p.low_stock_threshold).length;

  const activeLoans = loans.filter(
    (l) => l.business_id === businessId && !l.deleted_at && l.status === 'active',
  );
  const dueLoans = activeLoans.filter((l) => l.next_due_date === today).length;

  const todaySales = sum('sale');
  const todayPurchases = sum('purchase');
  const todayCollections = sum('payment_in');
  const todayExpenses = sum('expense');

  return {
    cashInHand,
    totalReceivable: receivable,
    totalPayable: payable,
    todaySales,
    todayPurchases,
    todayCollections,
    todayExpenses,
    todayDelta: todaySales + todayCollections - todayPurchases - todayExpenses,
    lowStockCount: lowStock,
    dueInstallmentCount: dueLoans,
  };
}

export function buildReport(
  parties: Party[],
  transactions: Transaction[],
  businessId: string,
  rangeDays = 30,
): ReportSummary {
  const cutoff = isoDateDaysAgo(rangeDays);
  const txs = transactions.filter(
    (t) =>
      t.business_id === businessId &&
      !t.deleted_at &&
      t.transaction_date >= cutoff,
  );

  const sales = sumType(txs, 'sale');
  const purchases = sumType(txs, 'purchase');
  const expenses = sumType(txs, 'expense');
  const collections = sumType(txs, 'payment_in');
  const profit = sales - purchases - expenses;
  const profitMargin = sales > 0 ? Math.round((profit / sales) * 100) : 0;
  const prevPeriodProfit = profitBetween(
    transactions,
    businessId,
    isoDateDaysAgo(rangeDays * 2),
    cutoff,
  );

  const dailySales: { label: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = isoDateDaysAgo(i);
    if (date < cutoff) continue;
    const amount = txs
      .filter((t) => t.type === 'sale' && t.transaction_date === date)
      .reduce((s, t) => s + t.amount, 0);
    dailySales.push({ label: bnDayLabel(date), amount });
  }

  const expenseMap = new Map<string, number>();
  for (const t of txs.filter((tx) => tx.type === 'expense')) {
    const label = t.note?.trim() || 'অন্যান্য';
    expenseMap.set(label, (expenseMap.get(label) ?? 0) + t.amount);
  }
  const expenseBreakdown = [...expenseMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, amount], i) => ({
      label,
      amount,
      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    }));

  const paymentMap = new Map<PaymentMethod, number>();
  for (const t of txs.filter((tx) => tx.type === 'sale' || tx.type === 'payment_in')) {
    const method = t.payment_method ?? 'cash';
    paymentMap.set(method, (paymentMap.get(method) ?? 0) + t.amount);
  }
  const paymentBreakdown = [...paymentMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([method, amount]) => ({ method, amount }));

  const bizParties = parties.filter((p) => p.business_id === businessId && !p.deleted_at);
  const totalReceivable = bizParties
    .filter((p) => p.balance > 0)
    .reduce((s, p) => s + p.balance, 0);

  const topCustomers = bizParties
    .filter((p) => p.type === 'customer' && p.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)
    .map((p) => ({ name: p.name, amount: p.balance }));

  return {
    profit,
    sales,
    purchases,
    expenses,
    collections,
    profitMargin,
    prevPeriodProfit,
    totalReceivable,
    dailySales,
    expenseBreakdown,
    paymentBreakdown,
    topCustomers,
  };
}

export { PAYMENT_COLORS };
