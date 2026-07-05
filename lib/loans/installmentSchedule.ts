import type { Loan } from '@/types/schema';
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

export function computeInstallmentSchedule(loan: Loan): ComputedInstallment[] {
  if (loan.principal <= 0 || loan.total_installments <= 0) return [];

  const perInstallment = loan.principal / loan.total_installments;
  const today = todayISO();
  const baseDue = loan.next_due_date ?? today;

  const items: ComputedInstallment[] = [];
  const base = new Date(`${baseDue}T12:00:00`);

  for (let i = 0; i < loan.total_installments; i++) {
    const due = new Date(base);
    due.setMonth(due.getMonth() - (loan.total_installments - 1 - i));
    const dueDate = due.toISOString().slice(0, 10);
    const isPaid = i < loan.paid_installments;

    let status: InstallmentStatus = 'upcoming';
    if (isPaid) status = 'paid';
    else if (dueDate < today) status = 'overdue';
    else if (dueDate === today) status = 'due';
    else status = 'upcoming';

    items.push({
      index: i + 1,
      amount: perInstallment,
      dueDate,
      status,
      paidDate: isPaid ? dueDate : null,
      delayed: isPaid && i === loan.paid_installments - 1 && false,
    });
  }

  return items;
}

export function loanPaidAmount(loan: Loan): number {
  if (loan.principal <= 0) return 0;
  const per = loan.principal / Math.max(loan.total_installments, 1);
  return per * loan.paid_installments;
}

export function loanTotalRepayable(loan: Loan): number {
  return loan.principal > 0 ? loan.principal : loan.outstanding;
}

export function nextInstallment(loan: Loan): ComputedInstallment | null {
  const schedule = computeInstallmentSchedule(loan);
  return schedule.find((s) => s.status === 'due' || s.status === 'overdue') ?? schedule.find((s) => s.status === 'upcoming') ?? null;
}

export function overdueInstallments(loans: Loan[]): { loan: Loan; inst: ComputedInstallment }[] {
  const result: { loan: Loan; inst: ComputedInstallment }[] = [];
  for (const loan of loans) {
    if (loan.status !== 'active' || loan.principal <= 0) continue;
    const overdue = computeInstallmentSchedule(loan).filter((s) => s.status === 'overdue');
    if (overdue[0]) result.push({ loan, inst: overdue[0] });
  }
  return result;
}

export function onTimeRatePercent(loans: Loan[]): number {
  const active = loans.filter((l) => l.principal > 0 && l.total_installments > 0);
  if (active.length === 0) return 100;
  const rates = active.map((l) => (l.paid_installments / l.total_installments) * 100);
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}
