import type {
  Business,
  BusinessInput,
  DashboardSummary,
  DayClose,
  Installment,
  Language,
  LearningItem,
  Loan,
  LoanInput,
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
    ...base(),
  },
];

const seedLoans: Loan[] = [
  {
    id: 'loan-1',
    business_id: MOCK_BUSINESS_ID,
    lender_name: 'ব্র্যাক ব্যাংক',
    loan_type: 'ব্যবসায়িক',
    principal: 50000,
    outstanding: 35000,
    total_installments: 12,
    paid_installments: 5,
    next_due_date: todayISO(),
    status: 'active',
    ...base(),
  },
];

const seedLearning: LearningItem[] = toLearningItems(LEARNING_ARTICLES);

export class MockRepository implements IDataRepository {
  private profile: Profile | null = null;
  private business = { ...seedBusiness };
  private parties = [...seedParties];
  private products = [...seedProducts];
  private transactions = [...seedTransactions];
  private loans = [...seedLoans];
  private installments: Installment[] = [];
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
      ...base(),
    };
    this.transactions.unshift(tx);

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
      principal: input.principal,
      outstanding: input.outstanding ?? input.principal,
      total_installments: input.total_installments,
      paid_installments: 0,
      next_due_date: input.next_due_date ?? todayISO(),
      status: 'active',
      ...base(),
    };
    this.loans.push(loan);
    this.syncState = 'pending';
    return loan;
  }

  async payInstallment(loanId: string, amount: number) {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');

    this.installments.push({
      id: uuid(),
      loan_id: loanId,
      amount,
      due_date: loan.next_due_date ?? todayISO(),
      paid_at: nowISO(),
      is_paid: true,
      ...base(),
    });

    loan.outstanding = Math.max(0, loan.outstanding - amount);
    loan.paid_installments += 1;
    if (loan.outstanding <= 0) loan.status = 'paid';
    if (loan.next_due_date) {
      const next = new Date(`${loan.next_due_date}T12:00:00`);
      next.setMonth(next.getMonth() + 1);
      loan.next_due_date = next.toISOString().slice(0, 10);
    }
    loan.updated_at = nowISO();
    this.business.cash_in_hand -= amount;
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
    return buildReport(parties, transactions, businessId, rangeDays ?? 30);
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
