import type { Installment, Loan, LoanPayment } from '@/types/schema';
import { todayISO } from '@/utils/bn-numerals';

export type InstallmentStatus = 'paid' | 'overdue' | 'due' | 'upcoming';

export interface ComputedInstallment {
  index: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  paidDate: string | null;
  delayed: boolean;
}

function paymentsPerYear(loan: Loan): number {
  return loan.frequency === 'weekly' ? 52 : 12;
}

/**
 * Real amortization plan at loan creation time — one row per installment,
 * respecting interest rate/type and payment frequency. This replaces the
 * old approach of reverse-engineering a schedule from principal ÷ count
 * on every render.
 */
export function generateInstallmentPlan(loan: Loan): { amount: number; due_date: string }[] {
  const periods = Math.max(1, loan.total_installments);
  const perYear = paymentsPerYear(loan);
  const annualRate = Math.max(0, loan.interest_rate ?? 0) / 100;
  const periodRate = annualRate / perYear;

  let amount: number;
  if (!loan.interest_type || loan.interest_type === 'none' || annualRate <= 0) {
    amount = loan.principal / periods;
  } else if (loan.interest_type === 'flat') {
    const totalInterest = loan.principal * annualRate * (periods / perYear);
    amount = (loan.principal + totalInterest) / periods;
  } else {
    // reducing balance — standard EMI formula
    if (periodRate <= 0) {
      amount = loan.principal / periods;
    } else {
      const factor = Math.pow(1 + periodRate, periods);
      amount = (loan.principal * periodRate * factor) / (factor - 1);
    }
  }
  amount = Math.round(amount * 100) / 100;

  const start = loan.first_due_date ?? loan.disbursed_on ?? todayISO();
  const startDate = new Date(`${start}T12:00:00`);
  const items: { amount: number; due_date: string }[] = [];
  for (let i = 0; i < periods; i++) {
    const due = new Date(startDate);
    if (loan.frequency === 'weekly') due.setDate(due.getDate() + i * 7);
    else due.setMonth(due.getMonth() + i);
    items.push({ amount, due_date: due.toISOString().slice(0, 10) });
  }
  return items;
}

export function loanTotalRepayable(loan: Loan): number {
  if (loan.principal <= 0) return loan.outstanding;
  return generateInstallmentPlan(loan).reduce((s, i) => s + i.amount, 0);
}

/** Maps real, persisted installment rows to display status. Falls back to
 * a synthetic plan only for legacy loans created before real installments
 * were generated and persisted (pre-Wave-3 data). */
export function toComputedSchedule(
  loan: Loan,
  installments: Installment[],
): ComputedInstallment[] {
  const today = todayISO();
  const source =
    installments.length > 0
      ? installments
          .slice()
          .sort((a, b) => a.due_date.localeCompare(b.due_date))
          .map((inst, i) => ({
            index: i + 1,
            amount: inst.amount,
            dueDate: inst.due_date,
            isPaid: inst.is_paid,
            paidDate: inst.paid_at ? inst.paid_at.slice(0, 10) : null,
          }))
      : generateInstallmentPlan(loan).map((p, i) => ({
          index: i + 1,
          amount: p.amount,
          dueDate: p.due_date,
          isPaid: i < loan.paid_installments,
          paidDate: i < loan.paid_installments ? p.due_date : null,
        }));

  return source.map(({ index, amount, dueDate, isPaid, paidDate }) => {
    let status: InstallmentStatus = 'upcoming';
    if (isPaid) status = 'paid';
    else if (dueDate < today) status = 'overdue';
    else if (dueDate === today) status = 'due';
    return {
      index,
      amount,
      dueDate,
      status,
      paidDate,
      delayed: isPaid && !!paidDate && paidDate > dueDate,
    };
  });
}

export function loanPaidAmount(loan: Loan, installments: Installment[] = []): number {
  if (installments.length > 0) {
    return installments.filter((i) => i.is_paid).reduce((s, i) => s + (i.paid_amount || i.amount), 0);
  }
  if (loan.principal <= 0) return 0;
  const per = loan.principal / Math.max(loan.total_installments, 1);
  return per * loan.paid_installments;
}

export function nextInstallment(
  loan: Loan,
  installments: Installment[] = [],
): ComputedInstallment | null {
  const schedule = toComputedSchedule(loan, installments);
  return (
    schedule.find((s) => s.status === 'due' || s.status === 'overdue') ??
    schedule.find((s) => s.status === 'upcoming') ??
    null
  );
}

export function overdueInstallments(
  loans: Loan[],
  installmentsByLoan: Record<string, Installment[]> = {},
): { loan: Loan; inst: ComputedInstallment }[] {
  const result: { loan: Loan; inst: ComputedInstallment }[] = [];
  for (const loan of loans) {
    if (loan.status !== 'active' || loan.principal <= 0) continue;
    const overdue = toComputedSchedule(loan, installmentsByLoan[loan.id] ?? []).filter(
      (s) => s.status === 'overdue',
    );
    if (overdue[0]) result.push({ loan, inst: overdue[0] });
  }
  return result;
}

/** Real on-time rate: the share of RECORDED payments that were not late
 * (days_late <= 0), computed from actual loan_payments history — not a
 * proxy for "how much of the loan is paid off". A loan with no recorded
 * payments yet has no rate to report (null), not a default 100%. */
export function onTimeRatePercent(payments: LoanPayment[]): number | null {
  if (payments.length === 0) return null;
  const onTime = payments.filter((p) => p.days_late <= 0).length;
  return Math.round((onTime / payments.length) * 100);
}

export function daysLate(dueDate: string, paidOn: string): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const paid = new Date(`${paidOn}T00:00:00`);
  const diff = Math.round((paid.getTime() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}
