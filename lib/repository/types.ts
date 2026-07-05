import type {
  Business,
  BusinessInput,
  Category,
  DashboardSummary,
  DayClose,
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
  getLoans(businessId: string, status?: Loan['status']): Promise<Loan[]>;
  createLoan(businessId: string, input: LoanInput): Promise<Loan>;
  payInstallment(loanId: string, amount: number): Promise<Loan>;
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
  getLearningItems(): Promise<LearningItem[]>;
  getSyncState(): SyncState;
  syncNow?(): Promise<void>;
  setLanguage?(lang: Language): Promise<void>;
  getLanguage?(): Promise<Language>;
}
