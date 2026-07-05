import type {
  Business,
  BusinessInput,
  DashboardSummary,
  DayClose,
  ExpenseCategory,
  Installment,
  Language,
  LearningItem,
  LineItem,
  Loan,
  LoanInput,
  LoanPayment,
  Party,
  PartyInput,
  Product,
  Profile,
  ReportSummary,
  Transaction,
  TransactionInput,
} from '@/types/schema';
import { LEARNING_ARTICLES, toLearningItems } from '@/constants/learningArticles';
import type { IDataRepository, SyncState } from '@/lib/repository/types';
import { buildDashboard, buildReport } from '@/lib/analytics/reportBuilder';
import { fetchCreditScoreSummary } from '@/lib/scoring/fetchCreditScoreSummary';
import { generateInstallmentPlan, daysLate } from '@/lib/loans/installmentSchedule';
import { todayISO, nowISO, uuid } from '@/utils/bn-numerals';

const MOCK_USER = 'mock-user-001';
const MOCK_BUSINESS_ID = 'biz-001';

function base() {
  const t = nowISO();
  return { created_at: t, updated_at: t, deleted_at: null as string | null };
}

const seedBusiness: Business = {
  id: MOCK_BUSINESS_ID,
  owner_id: MOCK_USER,
  name: 'করিম স্টোর',
  owner_name: 'করিম উদ্দিন',
  business_type: 'grocery',
  district: 'ঢাকা',
  logo_url: null,
  reminder_sms_template:
    'প্রিয় {{name}}, আপনার বাকি ৳{{amount}}। দয়া করে পরিশোধ করুন। — {{shop}}',
  cash_in_hand: 42350,
  ...base(),
};

const seedParties: Party[] = [
  {
    id: 'party-1',
    business_id: MOCK_BUSINESS_ID,
    name: 'করিম ভাই',
    phone: '01712345678',
    type: 'customer',
    balance: 1250,
    last_activity_at: nowISO(),
    notes: null,
    ...base(),
  },
  {
    id: 'party-2',
    business_id: MOCK_BUSINESS_ID,
    name: 'সালমা বেগম',
    phone: '01812345678',
    type: 'customer',
    balance: -200,
    last_activity_at: nowISO(),
    notes: null,
    ...base(),
  },
  {
    id: 'party-3',
    business_id: MOCK_BUSINESS_ID,
    name: 'রহিম ট্রেডার্স',
    phone: '01912345678',
    type: 'dealer',
    balance: -9500,
    last_activity_at: nowISO(),
    notes: null,
    ...base(),
  },
];

const seedProducts: Product[] = [
  {
    id: 'prod-1',
    business_id: MOCK_BUSINESS_ID,
    category_id: null,
    name: 'চাল (মিনিকেট)',
    unit: 'কেজি',
    qty: 45,
    low_stock_threshold: 20,
    cost_price: 55,
    sell_price: 62,
    icon_key: 'grocery',
    ...base(),
  },
  {
    id: 'prod-2',
    business_id: MOCK_BUSINESS_ID,
    category_id: null,
    name: 'সয়াবিন তেল',
    unit: 'লিটার',
    qty: 3,
    low_stock_threshold: 5,
    cost_price: 165,
    sell_price: 180,
    icon_key: 'grocery',
    ...base(),
  },
];

const seedTransactions: Transaction[] = [
  {
    id: 'tx-1',
    business_id: MOCK_BUSINESS_ID,
    party_id: 'party-1',
    type: 'sale',
    amount: 350,
    payment_method: 'cash',
    is_credit: true,
    note: 'বাকি বিক্রি',
    transaction_date: todayISO(),
    running_balance: 1250,
    expense_category_id: null,
    ...base(),
  },
  {
    id: 'tx-2',
    business_id: MOCK_BUSINESS_ID,
    party_id: null,
    type: 'expense',
    amount: 3000,
    payment_method: 'cash',
    is_credit: false,
    note: 'দোকান ভাড়া',
    transaction_date: todayISO(),
    running_balance: null,
    expense_category_id: null,
    ...base(),
  },
  {
    id: 'tx-3',
    business_id: MOCK_BUSINESS_ID,
    party_id: 'party-2',
    type: 'payment_in',
    amount: 200,
    payment_method: 'bkash',
    is_credit: false,
    note: 'টাকা আদায়',
    transaction_date: todayISO(),
    running_balance: -200,
    expense_category_id: null,
    ...base(),
  },
];

function monthsAgoISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

const seedLoans: Loan[] = [
  {
    id: 'loan-1',
    business_id: MOCK_BUSINESS_ID,
    lender_name: 'ব্র্যাক ব্যাংক',
    loan_type: 'ব্যবসায়িক',
    lender_type: 'bank',
    principal: 50000,
    outstanding: 35000,
    total_installments: 12,
    paid_installments: 5,
    next_due_date: todayISO(),
    status: 'active',
    interest_rate: 12,
    interest_type: 'flat',
    disbursed_on: monthsAgoISO(6),
    first_due_date: monthsAgoISO(5),
    frequency: 'monthly',
    ...base(),
  },
];

const seedLoan1Plan = generateInstallmentPlan(seedLoans[0]);
const seedInstallments: Installment[] = seedLoan1Plan.map((p, i) => ({
  id: `inst-1-${i + 1}`,
  loan_id: seedLoans[0].id,
  amount: p.amount,
  due_date: p.due_date,
  paid_at: i < seedLoans[0].paid_installments ? nowISO() : null,
  is_paid: i < seedLoans[0].paid_installments,
  paid_amount: i < seedLoans[0].paid_installments ? p.amount : 0,
  ...base(),
}));
const seedLoanPayments: LoanPayment[] = seedInstallments
  .filter((i) => i.is_paid)
  .map((inst, i) => ({
    id: `lp-1-${i + 1}`,
    loan_id: seedLoans[0].id,
    installment_id: inst.id,
    amount: inst.amount,
    due_date: inst.due_date,
    paid_on: inst.due_date,
    days_late: 0,
    ...base(),
  }));

const seedLearning: LearningItem[] = toLearningItems(LEARNING_ARTICLES);

const seedExpenseCategories: ExpenseCategory[] = [
  { id: '00000000-0000-0000-0000-000000000001', business_id: null, name_bn: 'দোকান ভাড়া', name_en: 'Shop rent', is_system: true, sort_order: 1, ...base() },
  { id: '00000000-0000-0000-0000-000000000002', business_id: null, name_bn: 'বিদ্যুৎ বিল', name_en: 'Electricity', is_system: true, sort_order: 2, ...base() },
  { id: '00000000-0000-0000-0000-000000000003', business_id: null, name_bn: 'পরিবহন', name_en: 'Transport', is_system: true, sort_order: 3, ...base() },
  { id: '00000000-0000-0000-0000-000000000004', business_id: null, name_bn: 'বেতন', name_en: 'Salary', is_system: true, sort_order: 4, ...base() },
  { id: '00000000-0000-0000-0000-000000000005', business_id: null, name_bn: 'মেরামত', name_en: 'Repairs', is_system: true, sort_order: 5, ...base() },
  { id: '00000000-0000-0000-0000-000000000006', business_id: null, name_bn: 'অন্যান্য', name_en: 'Other', is_system: true, sort_order: 6, ...base() },
];

export class MockRepository implements IDataRepository {
  private profile: Profile | null = null;
  private business = { ...seedBusiness };
  private parties = [...seedParties];
  private products = [...seedProducts];
  private transactions = [...seedTransactions];
  private loans = [...seedLoans];
  private installments: Installment[] = [...seedInstallments];
  private loanPayments: LoanPayment[] = [...seedLoanPayments];
  private lineItems: LineItem[] = [];
  private dayCloses: DayClose[] = [];
  private language: Language = 'bn';
  private syncState: SyncState = 'online';

  async init() {}

  async getProfile(userId: string) {
    return this.profile?.user_id === userId ? this.profile : null;
  }

  async upsertProfile(p: Partial<Profile> & { user_id: string }) {
    this.profile = {
      id: this.profile?.id ?? uuid(),
      user_id: p.user_id,
      language: p.language ?? 'bn',
      full_name: p.full_name ?? this.profile?.full_name ?? null,
      phone: p.phone ?? this.profile?.phone ?? null,
      username: p.username ?? this.profile?.username ?? null,
      ...base(),
    };
    return this.profile;
  }

  async getBusinesses(ownerId: string) {
    return ownerId === MOCK_USER || ownerId ? [this.business] : [];
  }

  async getBusiness(id: string) {
    return id === this.business.id ? this.business : null;
  }

  async createBusiness(ownerId: string, input: BusinessInput) {
    this.business = {
      id: uuid(),
      owner_id: ownerId,
      cash_in_hand: 0,
      reminder_sms_template: input.reminder_sms_template ?? seedBusiness.reminder_sms_template,
      logo_url: input.logo_url ?? null,
      ...input,
      ...base(),
    };
    return this.business;
  }

  async updateBusiness(id: string, patch: Partial<Business>) {
    if (this.business.id !== id) throw new Error('Business not found');
    this.business = { ...this.business, ...patch, updated_at: nowISO() };
    return this.business;
  }

  async getParties(businessId: string, type?: Party['type']) {
    return this.parties.filter(
      (p) => p.business_id === businessId && !p.deleted_at && (!type || p.type === type),
    );
  }

  async getParty(id: string) {
    return this.parties.find((p) => p.id === id) ?? null;
  }

  async createParty(input: PartyInput) {
    const party: Party = {
      id: uuid(),
      balance: 0,
      last_activity_at: nowISO(),
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      ...input,
      ...base(),
    };
    this.parties.push(party);
    return party;
  }

  async updateParty(id: string, patch: Partial<Party>) {
    const i = this.parties.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('Party not found');
    this.parties[i] = { ...this.parties[i], ...patch, updated_at: nowISO() };
    return this.parties[i];
  }

  async getProducts(businessId: string) {
    return this.products.filter((p) => p.business_id === businessId && !p.deleted_at);
  }

  async getCategories(businessId: string) {
    const { buildCategoriesForBusiness } = await import('@/constants/productCategories');
    return buildCategoriesForBusiness(businessId);
  }

  async getProduct(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async createProduct(businessId: string, data: Partial<Product>) {
    const product: Product = {
      id: uuid(),
      business_id: businessId,
      category_id: data.category_id ?? null,
      name: data.name ?? '',
      unit: data.unit ?? 'pcs',
      qty: data.qty ?? 0,
      low_stock_threshold: data.low_stock_threshold ?? 5,
      cost_price: data.cost_price ?? 0,
      sell_price: data.sell_price ?? 0,
      icon_key: data.icon_key ?? 'grocery',
      ...base(),
    };
    this.products.push(product);
    return product;
  }

  async updateProduct(id: string, patch: Partial<Product>) {
    const i = this.products.findIndex((p) => p.id === id);
    if (i < 0) throw new Error('Product not found');
    this.products[i] = { ...this.products[i], ...patch, updated_at: nowISO() };
    return this.products[i];
  }

  async getTransactions(businessId: string, partyId?: string) {
    return this.transactions
      .filter(
        (t) =>
          t.business_id === businessId &&
          !t.deleted_at &&
          (!partyId || t.party_id === partyId),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getLineItems(businessId: string) {
    const txIds = new Set(
      this.transactions.filter((t) => t.business_id === businessId && !t.deleted_at).map((t) => t.id),
    );
    return this.lineItems.filter((li) => txIds.has(li.transaction_id) && !li.deleted_at);
  }

  async createTransaction(input: TransactionInput) {
    const tx: Transaction = {
      id: uuid(),
      business_id: input.business_id,
      party_id: input.party_id ?? null,
      type: input.type,
      amount: input.amount,
      payment_method: input.payment_method ?? 'cash',
      is_credit: input.is_credit ?? false,
      note: input.note ?? null,
      transaction_date: input.transaction_date ?? todayISO(),
      running_balance: null,
      expense_category_id: input.expense_category_id ?? null,
      ...base(),
    };
    this.transactions.unshift(tx);

    if (input.line_items && input.line_items.length > 0) {
      for (const li of input.line_items) {
        this.lineItems.push({
          id: uuid(),
          transaction_id: tx.id,
          product_id: li.product_id ?? null,
          name: li.name,
          qty: li.qty,
          unit_price: li.unit_price,
          total: li.total,
          ...base(),
        });
      }
    }

    if (input.party_id) {
      const party = await this.getParty(input.party_id);
      if (party) {
        let delta = 0;
        if (input.type === 'sale' && input.is_credit) delta = input.amount;
        if (input.type === 'purchase' && input.is_credit) delta = -input.amount;
        if (input.type === 'payment_in') delta = -input.amount;
        if (input.type === 'payment_out') delta = input.amount;
        const balance = party.balance + delta;
        await this.updateParty(party.id, { balance, last_activity_at: nowISO() });
        tx.running_balance = balance;
      }
    }

    if (!input.is_credit && input.type === 'sale') {
      this.business.cash_in_hand += input.amount;
    }
    if (input.type === 'payment_in') {
      this.business.cash_in_hand += input.amount;
    }
    if (['purchase', 'payment_out', 'expense'].includes(input.type)) {
      this.business.cash_in_hand -= input.amount;
    }

    this.syncState = 'pending';
    return tx;
  }

  async deleteTransaction(id: string) {
    const tx = this.transactions.find((t) => t.id === id && !t.deleted_at);
    if (!tx) return;

    if (tx.party_id) {
      const party = await this.getParty(tx.party_id);
      if (party) {
        let delta = 0;
        if (tx.type === 'sale' && tx.is_credit) delta = tx.amount;
        if (tx.type === 'purchase' && tx.is_credit) delta = -tx.amount;
        if (tx.type === 'payment_in') delta = -tx.amount;
        if (tx.type === 'payment_out') delta = tx.amount;
        await this.updateParty(party.id, { balance: party.balance - delta });
      }
    }

    if (!tx.is_credit && tx.type === 'sale') this.business.cash_in_hand -= tx.amount;
    if (tx.type === 'payment_in') this.business.cash_in_hand -= tx.amount;
    if (['purchase', 'payment_out', 'expense'].includes(tx.type)) {
      this.business.cash_in_hand += tx.amount;
    }

    tx.deleted_at = nowISO();
    tx.updated_at = nowISO();
    this.syncState = 'pending';
  }

  async getExpenseCategories(_businessId: string) {
    return seedExpenseCategories;
  }

  async getLoans(businessId: string, status?: Loan['status']) {
    return this.loans.filter(
      (l) => l.business_id === businessId && !l.deleted_at && (!status || l.status === status),
    );
  }

  async createLoan(businessId: string, input: LoanInput) {
    const loan: Loan = {
      id: uuid(),
      business_id: businessId,
      lender_name: input.lender_name,
      loan_type: input.loan_type,
      lender_type: input.lender_type ?? 'personal',
      principal: input.principal,
      outstanding: input.outstanding ?? input.principal,
      total_installments: input.total_installments,
      paid_installments: 0,
      next_due_date: input.next_due_date ?? todayISO(),
      status: 'active',
      interest_rate: input.interest_rate ?? 0,
      interest_type: input.interest_type ?? 'flat',
      disbursed_on: input.disbursed_on ?? null,
      first_due_date: input.first_due_date ?? null,
      frequency: input.frequency ?? 'monthly',
      ...base(),
    };
    const plan = loan.principal > 0 && loan.total_installments > 0 ? generateInstallmentPlan(loan) : [];
    if (plan.length > 0) loan.next_due_date = plan[0].due_date;
    this.loans.push(loan);
    for (const p of plan) {
      this.installments.push({
        id: uuid(),
        loan_id: loan.id,
        amount: p.amount,
        due_date: p.due_date,
        paid_at: null,
        is_paid: false,
        paid_amount: 0,
        ...base(),
      });
    }
    this.syncState = 'pending';
    return loan;
  }

  async getInstallments(loanId: string) {
    return this.installments
      .filter((i) => i.loan_id === loanId && !i.deleted_at)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }

  async getLoanPayments(businessId: string) {
    const loanIds = new Set(this.loans.filter((l) => l.business_id === businessId).map((l) => l.id));
    return this.loanPayments
      .filter((p) => loanIds.has(p.loan_id) && !p.deleted_at)
      .sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  }

  async payInstallment(loanId: string, amount?: number, paidOn?: string) {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');

    const nextUnpaid = (await this.getInstallments(loanId)).find((i) => !i.is_paid);
    const paidDate = paidOn ?? todayISO();
    const paidAmount = amount ?? nextUnpaid?.amount ?? loan.outstanding;

    if (nextUnpaid) {
      nextUnpaid.is_paid = true;
      nextUnpaid.paid_amount = paidAmount;
      nextUnpaid.paid_at = nowISO();
      nextUnpaid.updated_at = nowISO();
      this.loanPayments.push({
        id: uuid(),
        loan_id: loanId,
        installment_id: nextUnpaid.id,
        amount: paidAmount,
        due_date: nextUnpaid.due_date,
        paid_on: paidDate,
        days_late: daysLate(nextUnpaid.due_date, paidDate),
        ...base(),
      });
    }

    loan.outstanding = Math.max(0, loan.outstanding - paidAmount);
    loan.paid_installments += 1;
    const remaining = (await this.getInstallments(loanId)).filter((i) => !i.is_paid);
    loan.next_due_date = remaining[0]?.due_date ?? null;
    if (remaining.length === 0 || loan.outstanding <= 0) loan.status = 'paid';
    loan.updated_at = nowISO();
    this.business.cash_in_hand -= paidAmount;
    this.syncState = 'pending';
    return loan;
  }

  async getDayCloses(businessId: string) {
    return this.dayCloses.filter((d) => d.business_id === businessId);
  }

  async createDayClose(businessId: string, expected: number, counted: number, note?: string) {
    const dc: DayClose = {
      id: uuid(),
      business_id: businessId,
      close_date: todayISO(),
      expected_cash: expected,
      counted_cash: counted,
      difference: counted - expected,
      is_locked: true,
      note: note ?? null,
      ...base(),
    };
    this.dayCloses.push(dc);
    return dc;
  }

  async isDayLocked(businessId: string, date: string) {
    return this.dayCloses.some(
      (d) => d.business_id === businessId && d.close_date === date && d.is_locked,
    );
  }

  async getDashboard(businessId: string): Promise<DashboardSummary> {
    const parties = await this.getParties(businessId);
    const products = await this.getProducts(businessId);
    const loans = await this.getLoans(businessId, 'active');
    const transactions = this.transactions.filter(
      (t) => t.business_id === businessId && !t.deleted_at,
    );
    return buildDashboard(
      this.business.cash_in_hand,
      parties,
      products,
      transactions,
      loans,
      businessId,
    );
  }

  async getReport(businessId: string, rangeDays?: number): Promise<ReportSummary> {
    const parties = await this.getParties(businessId);
    const transactions = this.transactions.filter(
      (t) => t.business_id === businessId && !t.deleted_at,
    );
    const lineItems = await this.getLineItems(businessId);
    const products = await this.getProducts(businessId);
    return buildReport(
      parties,
      transactions,
      businessId,
      rangeDays ?? 30,
      seedExpenseCategories,
      lineItems,
      products,
    );
  }

  async getCreditScoreSummary(businessId: string) {
    return fetchCreditScoreSummary(businessId);
  }

  async getLearningItems() {
    return seedLearning;
  }

  getSyncState(): SyncState {
    return this.syncState;
  }

  async syncNow() {
    this.syncState = 'online';
  }

  async setLanguage(lang: Language) {
    this.language = lang;
  }

  async getLanguage() {
    return this.language;
  }
}

export const mockRepository = new MockRepository();
