import type {
  Business,
  BusinessInput,
  Category,
  CreditScoreSnapshot,
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
import type { CreditScoreSummary } from '@/types/creditScore';

export type SyncState = 'online' | 'pending' | 'offline';

export interface IDataRepository {
  init(): Promise<void>;
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(profile: Partial<Profile> & { user_id: string }): Promise<Profile>;
  getBusinesses(ownerId: string): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | null>;
  createBusiness(ownerId: string, input: BusinessInput): Promise<Business>;
  updateBusiness(id: string, patch: Partial<Business>): Promise<Business>;
  getParties(businessId: string, type?: Party['type']): Promise<Party[]>;
  getParty(id: string): Promise<Party | null>;
  createParty(input: PartyInput): Promise<Party>;
  updateParty(id: string, patch: Partial<Party>): Promise<Party>;
  getProducts(businessId: string): Promise<Product[]>;
  getCategories(businessId: string): Promise<Category[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(businessId: string, data: Partial<Product>): Promise<Product>;
  updateProduct(id: string, patch: Partial<Product>): Promise<Product>;
  getTransactions(businessId: string, partyId?: string): Promise<Transaction[]>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  getLineItems(businessId: string): Promise<LineItem[]>;
  getExpenseCategories(businessId: string): Promise<ExpenseCategory[]>;
  getLoans(businessId: string, status?: Loan['status']): Promise<Loan[]>;
  createLoan(businessId: string, input: LoanInput): Promise<Loan>;
  getInstallments(loanId: string): Promise<Installment[]>;
  /** Pays the next unpaid installment. If amount is omitted, uses that
   * installment's scheduled amount. paidOn defaults to today — pass it
   * explicitly to backdate/record a late payment accurately. */
  payInstallment(loanId: string, amount?: number, paidOn?: string): Promise<Loan>;
  getLoanPayments(businessId: string): Promise<LoanPayment[]>;
  getDayCloses(businessId: string): Promise<DayClose[]>;
  createDayClose(
    businessId: string,
    expected: number,
    counted: number,
    note?: string,
  ): Promise<DayClose>;
  isDayLocked(businessId: string, date: string): Promise<boolean>;
  getDashboard(businessId: string): Promise<DashboardSummary>;
  getReport(businessId: string, rangeDays?: number): Promise<ReportSummary>;
  getCreditScoreSummary(businessId: string): Promise<CreditScoreSummary>;
  getLatestCreditScoreSnapshot(businessId: string): Promise<CreditScoreSnapshot | null>;
  saveCreditScoreSnapshot(
    snapshot: Omit<CreditScoreSnapshot, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ): Promise<CreditScoreSnapshot>;
  getLearningItems(): Promise<LearningItem[]>;
  /** Full data dump for a business — every table added through Wave 5
   * (loans, installments, loan_payments, line_items, expense_categories,
   * credit_scores) — so an exported backup can't silently drop the loan
   * and credit history that is this app's whole point. */
  exportBackup(businessId: string): Promise<Record<string, unknown>>;
  /** Merges an exported backup back in (upsert by id per table). Does not
   * delete rows absent from the backup. */
  restoreBackup(businessId: string, payload: Record<string, unknown>): Promise<{ tables: number; rows: number }>;
  getSyncState(): SyncState;
  syncNow?(): Promise<void>;
  setLanguage?(lang: Language): Promise<void>;
  getLanguage?(): Promise<Language>;
}
