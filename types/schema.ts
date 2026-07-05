/** Shared contract — changes require B (Supabase) + D (SQLite) review */

export type SyncStatus = 'synced' | 'pending' | 'error';
export type Language = 'bn' | 'en';
export type PartyType = 'customer' | 'dealer';
export type TransactionType =
  | 'sale'
  | 'purchase'
  | 'payment_in'
  | 'payment_out'
  | 'expense';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'card';
export type LoanStatus = 'active' | 'paid';
export type LenderType = 'bank' | 'mfi' | 'personal';
export type InterestType = 'flat' | 'reducing' | 'none';
export type LoanFrequency = 'weekly' | 'monthly';
export type CreditBand = 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
export type ScoreConfidence = 'preliminary' | 'building' | 'verified';
export type BusinessType =
  | 'grocery'
  | 'pharmacy'
  | 'garment'
  | 'food'
  | 'electronics'
  | 'hardware'
  | 'salon'
  | 'automotive'
  | 'agriculture'
  | 'wholesale'
  | 'services'
  | 'ecommerce'
  | 'other';

export enum TableName {
  Profiles = 'profiles',
  Businesses = 'businesses',
  Parties = 'parties',
  Categories = 'categories',
  Products = 'products',
  Transactions = 'transactions',
  LineItems = 'line_items',
  Loans = 'loans',
  Installments = 'installments',
  LoanPayments = 'loan_payments',
  ExpenseCategories = 'expense_categories',
  CreditScores = 'credit_scores',
  DayCloses = 'day_closes',
  LearningItems = 'learning_items',
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LocalEntity extends BaseEntity {
  sync_status: SyncStatus;
}

export interface Profile extends BaseEntity {
  user_id: string;
  language: Language;
  full_name: string | null;
  phone: string | null;
  username: string | null;
}

export interface Business extends BaseEntity {
  owner_id: string;
  name: string;
  owner_name: string;
  business_type: BusinessType;
  district: string;
  address?: string;
  logo_url: string | null;
  reminder_sms_template: string;
  cash_in_hand: number;
  established_on?: string | null;
  trade_license_no?: string | null;
  nid_no?: string | null;
}

export interface Party extends BaseEntity {
  business_id: string;
  name: string;
  phone: string | null;
  type: PartyType;
  balance: number;
  last_activity_at: string | null;
  notes: string | null;
}

export interface Category extends BaseEntity {
  business_id: string;
  name: string;
  color: string | null;
}

export interface Product extends BaseEntity {
  business_id: string;
  category_id: string | null;
  name: string;
  unit: string;
  qty: number;
  low_stock_threshold: number;
  cost_price: number;
  sell_price: number;
  icon_key: string | null;
}

export interface Transaction extends BaseEntity {
  business_id: string;
  party_id: string | null;
  type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  is_credit: boolean;
  note: string | null;
  transaction_date: string;
  running_balance: number | null;
  expense_category_id: string | null;
}

export interface ExpenseCategory extends BaseEntity {
  business_id: string | null;
  name_bn: string;
  name_en: string;
  is_system: boolean;
  sort_order: number;
}

export interface LineItem extends BaseEntity {
  transaction_id: string;
  product_id: string | null;
  name: string;
  qty: number;
  unit_price: number;
  total: number;
}

export interface Loan extends BaseEntity {
  business_id: string;
  lender_name: string;
  loan_type: string;
  lender_type?: LenderType;
  principal: number;
  outstanding: number;
  total_installments: number;
  paid_installments: number;
  next_due_date: string | null;
  status: LoanStatus;
  interest_rate?: number;
  interest_type?: InterestType;
  disbursed_on?: string | null;
  first_due_date?: string | null;
  frequency?: LoanFrequency;
}

export interface Installment extends BaseEntity {
  loan_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  is_paid: boolean;
  paid_amount?: number;
}

export interface LoanPayment extends BaseEntity {
  loan_id: string;
  installment_id: string | null;
  amount: number;
  due_date: string;
  paid_on: string;
  days_late: number;
}

export interface CreditScoreDriver {
  key: string;
  label: string;
  impact: number;
}

export interface CreditScoreSnapshot extends BaseEntity {
  business_id: string;
  score: number;
  band: CreditBand;
  confidence: ScoreConfidence;
  dscr: number | null;
  drivers: CreditScoreDriver[];
  computed_at: string;
}

export interface DayClose extends BaseEntity {
  business_id: string;
  close_date: string;
  expected_cash: number;
  counted_cash: number;
  difference: number;
  is_locked: boolean;
  note: string | null;
}

export interface LearningItem extends BaseEntity {
  title_bn: string;
  title_en: string;
  summary_bn: string;
  summary_en: string;
  body_bn?: string;
  body_en?: string;
  category: string;
  sort_order: number;
  is_new: boolean;
  business_types?: (BusinessType | '*')[];
}

export interface TransactionInput {
  business_id: string;
  party_id?: string | null;
  type: TransactionType;
  amount: number;
  payment_method?: PaymentMethod;
  is_credit?: boolean;
  note?: string | null;
  transaction_date?: string;
  expense_category_id?: string | null;
  line_items?: Omit<LineItem, keyof BaseEntity | 'transaction_id'>[];
}

export interface PartyInput {
  business_id: string;
  name: string;
  phone?: string | null;
  type: PartyType;
  notes?: string | null;
}

export interface BusinessInput {
  name: string;
  owner_name: string;
  business_type: BusinessType;
  district: string;
  address?: string;
  logo_url?: string | null;
  reminder_sms_template?: string;
}

export interface LoanInput {
  lender_name: string;
  loan_type: string;
  lender_type?: LenderType;
  principal: number;
  outstanding?: number;
  total_installments: number;
  next_due_date?: string | null;
  interest_rate?: number;
  interest_type?: InterestType;
  disbursed_on?: string | null;
  first_due_date?: string | null;
  frequency?: LoanFrequency;
}

export interface DashboardSummary {
  cashInHand: number;
  totalReceivable: number;
  totalPayable: number;
  todaySales: number;
  todayPurchases: number;
  todayCollections: number;
  todayExpenses: number;
  todayDelta: number;
  lowStockCount: number;
  dueInstallmentCount: number;
}

export interface ReportSummary {
  profit: number;
  sales: number;
  purchases: number;
  expenses: number;
  collections: number;
  profitMargin: number;
  prevPeriodProfit: number;
  totalReceivable: number;
  dailySales: { label: string; amount: number }[];
  expenseBreakdown: { label: string; amount: number; color: string }[];
  paymentBreakdown: { method: PaymentMethod; amount: number }[];
  topCustomers: { name: string; amount: number }[];
}
