import type {
  BusinessType,
  CreditScoreSnapshot,
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
  Product,
  Transaction,
  TransactionInput,
} from '@/types/schema';
import { buildDashboard, buildReport } from '@/lib/analytics/reportBuilder';
import { computeCreditScore } from '@/lib/scoring/scoreEngine';
import { getDatabase, getMeta, setMeta } from '@/lib/db/database';
import { mockRepository } from '@/lib/mock/MockRepository';
import type { IDataRepository, SyncState } from '@/lib/repository/types';
import { isOnline, syncEngine } from '@/lib/sync/syncEngine';
import { generateInstallmentPlan, daysLate } from '@/lib/loans/installmentSchedule';
import { nowISO, todayISO, uuid } from '@/utils/bn-numerals';

function rowToBool(v: unknown) {
  return v === 1 || v === true;
}

/** LocalRepository wraps SQLite with MockRepository fallback for dev bootstrap only */
export class LocalRepository implements IDataRepository {
  private fallback = mockRepository;
  private syncState: SyncState = 'offline';
  private ready = false;

  async init() {
    await getDatabase();
    this.ready = true;
    if (await isOnline()) {
      this.syncState = 'online';
      try {
        await syncEngine();
      } catch {
        this.syncState = 'pending';
      }
    }
  }

  private async db() {
    if (!this.ready) await this.init();
    return getDatabase();
  }

  async getProfile(userId: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM profiles WHERE user_id = ? AND deleted_at IS NULL',
      [userId],
    );
    if (!row) return this.fallback.getProfile(userId);
    return this.mapProfile(row);
  }

  async upsertProfile(p: Parameters<IDataRepository['upsertProfile']>[0]) {
    const db = await this.db();
    const existing = await this.getProfile(p.user_id);
    const profile = {
      id: existing?.id ?? uuid(),
      user_id: p.user_id,
      language: p.language ?? 'bn',
      full_name: p.full_name ?? existing?.full_name ?? null,
      phone: p.phone ?? existing?.phone ?? null,
      username: p.username ?? existing?.username ?? null,
      created_at: existing?.created_at ?? nowISO(),
      updated_at: nowISO(),
      deleted_at: null,
    };
    await db.runAsync(
      `INSERT OR REPLACE INTO profiles (id, user_id, language, full_name, phone, username, created_at, updated_at, deleted_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending')`,
      [
        profile.id,
        profile.user_id,
        profile.language,
        profile.full_name,
        profile.phone,
        profile.username,
        profile.created_at,
        profile.updated_at,
      ],
    );
    if (p.language) await setMeta('language', p.language);
    return profile;
  }

  async getBusinesses(ownerId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM businesses WHERE owner_id = ? AND deleted_at IS NULL',
      [ownerId],
    );
    if (rows.length === 0) return this.fallback.getBusinesses(ownerId);
    return rows.map((r) => this.mapBusiness(r));
  }

  async getBusiness(id: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM businesses WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    if (!row) return this.fallback.getBusiness(id);
    return this.mapBusiness(row);
  }

  async createBusiness(ownerId: string, input: Parameters<IDataRepository['createBusiness']>[1]) {
    const biz = await this.fallback.createBusiness(ownerId, input);
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO businesses (id, owner_id, name, owner_name, business_type, district, logo_url, reminder_sms_template, cash_in_hand, established_on, trade_license_no, nid_no, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        biz.id,
        biz.owner_id,
        biz.name,
        biz.owner_name,
        biz.business_type,
        biz.district,
        biz.logo_url,
        biz.reminder_sms_template,
        biz.cash_in_hand,
        biz.established_on ?? null,
        biz.trade_license_no ?? null,
        biz.nid_no ?? null,
        biz.created_at,
        biz.updated_at,
      ],
    );
    this.syncState = 'pending';
    return biz;
  }

  async updateBusiness(id: string, patch: Parameters<IDataRepository['updateBusiness']>[1]) {
    const existing = await this.getBusiness(id);
    if (!existing) throw new Error('Business not found');
    const biz = { ...existing, ...patch, updated_at: nowISO() };
    const db = await this.db();
    await db.runAsync(
      `UPDATE businesses SET name=?, owner_name=?, district=?, logo_url=?, reminder_sms_template=?, cash_in_hand=?, established_on=?, trade_license_no=?, nid_no=?, updated_at=?, sync_status='pending' WHERE id=?`,
      [
        biz.name,
        biz.owner_name,
        biz.district,
        biz.logo_url,
        biz.reminder_sms_template,
        biz.cash_in_hand,
        biz.established_on ?? null,
        biz.trade_license_no ?? null,
        biz.nid_no ?? null,
        nowISO(),
        id,
      ],
    );
    this.syncState = 'pending';
    return biz;
  }

  async getParties(businessId: string, type?: Parameters<IDataRepository['getParties']>[1]) {
    const db = await this.db();
    if (type) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM parties WHERE business_id = ? AND type = ? AND deleted_at IS NULL ORDER BY name ASC',
        [businessId, type],
      );
      return rows.map((r) => this.mapParty(r));
    }
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM parties WHERE business_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      [businessId],
    );
    return rows.map((r) => this.mapParty(r));
  }

  async getParty(id: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM parties WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return row ? this.mapParty(row) : null;
  }

  async createParty(input: Parameters<IDataRepository['createParty']>[0]) {
    const party = await this.fallback.createParty(input);
    await this.persistParty(party);
    return party;
  }

  async updateParty(id: string, patch: Parameters<IDataRepository['updateParty']>[1]) {
    const party = await this.fallback.updateParty(id, patch);
    await this.persistParty(party);
    return party;
  }

  private async persistParty(party: Party) {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO parties (id, business_id, name, phone, type, balance, last_activity_at, notes, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        party.id,
        party.business_id,
        party.name,
        party.phone,
        party.type,
        party.balance,
        party.last_activity_at,
        party.notes,
        party.created_at,
        party.updated_at,
      ],
    );
    this.syncState = 'pending';
  }

  async getProducts(businessId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM products WHERE business_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      [businessId],
    );
    return rows.map((r) => this.mapProduct(r));
  }

  async getCategories(businessId: string) {
    const { buildCategoriesForBusiness } = await import('@/constants/productCategories');
    return buildCategoriesForBusiness(businessId);
  }

  async getProduct(id: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    return row ? this.mapProduct(row) : null;
  }

  async createProduct(businessId: string, data: Parameters<IDataRepository['createProduct']>[1]) {
    const p = await this.fallback.createProduct(businessId, data);
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, business_id, category_id, name, unit, qty, low_stock_threshold, cost_price, sell_price, icon_key, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        p.id,
        p.business_id,
        p.category_id,
        p.name,
        p.unit,
        p.qty,
        p.low_stock_threshold,
        p.cost_price,
        p.sell_price,
        p.icon_key,
        p.created_at,
        p.updated_at,
      ],
    );
    this.syncState = 'pending';
    return p;
  }

  async updateProduct(id: string, patch: Parameters<IDataRepository['updateProduct']>[1]) {
    const p = await this.fallback.updateProduct(id, patch);
    await this.persistProduct(p);
    return p;
  }

  private async persistProduct(p: Product) {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, business_id, category_id, name, unit, qty, low_stock_threshold, cost_price, sell_price, icon_key, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        p.id,
        p.business_id,
        p.category_id,
        p.name,
        p.unit,
        p.qty,
        p.low_stock_threshold,
        p.cost_price,
        p.sell_price,
        p.icon_key,
        p.created_at,
        p.updated_at,
      ],
    );
    this.syncState = 'pending';
  }

  async getTransactions(businessId: string, partyId?: string) {
    const db = await this.db();
    if (partyId) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM transactions WHERE business_id = ? AND party_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        [businessId, partyId],
      );
      return rows.map((r) => this.mapTransaction(r));
    }
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM transactions WHERE business_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [businessId],
    );
    return rows.map((r) => this.mapTransaction(r));
  }

  async createTransaction(input: TransactionInput) {
    const db = await this.db();
    const ts = nowISO();
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
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
    };

    if (input.party_id) {
      const party = await this.getParty(input.party_id);
      if (party) {
        let delta = 0;
        if (input.type === 'sale' && input.is_credit) delta = input.amount;
        if (input.type === 'purchase' && input.is_credit) delta = -input.amount;
        if (input.type === 'payment_in') delta = -input.amount;
        if (input.type === 'payment_out') delta = input.amount;
        const balance = party.balance + delta;
        tx.running_balance = balance;
        await this.persistParty({
          ...party,
          balance,
          last_activity_at: ts,
          updated_at: ts,
        });
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO transactions (id, business_id, party_id, type, amount, payment_method, is_credit, note, transaction_date, running_balance, expense_category_id, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        tx.id,
        tx.business_id,
        tx.party_id,
        tx.type,
        tx.amount,
        tx.payment_method,
        tx.is_credit ? 1 : 0,
        tx.note,
        tx.transaction_date,
        tx.running_balance,
        tx.expense_category_id,
        tx.created_at,
        tx.updated_at,
      ],
    );

    if (input.line_items && input.line_items.length > 0) {
      for (const li of input.line_items) {
        await db.runAsync(
          `INSERT INTO line_items (id, transaction_id, product_id, name, qty, unit_price, total, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [uuid(), tx.id, li.product_id ?? null, li.name, li.qty, li.unit_price, li.total, ts, ts],
        );
      }
    }

    const biz = await this.getBusiness(input.business_id);
    if (biz) {
      let cash = biz.cash_in_hand;
      if (!input.is_credit && input.type === 'sale') cash += input.amount;
      if (input.type === 'payment_in') cash += input.amount;
      if (['purchase', 'payment_out', 'expense'].includes(input.type)) cash -= input.amount;
      await db.runAsync(
        `UPDATE businesses SET cash_in_hand=?, updated_at=?, sync_status='pending' WHERE id=?`,
        [cash, ts, biz.id],
      );
    }

    this.syncState = 'pending';
    return tx;
  }

  async deleteTransaction(id: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL',
      [id],
    );
    if (!row) return;
    const tx = this.mapTransaction(row);
    const ts = nowISO();

    if (tx.party_id) {
      const party = await this.getParty(tx.party_id);
      if (party) {
        let delta = 0;
        if (tx.type === 'sale' && tx.is_credit) delta = tx.amount;
        if (tx.type === 'purchase' && tx.is_credit) delta = -tx.amount;
        if (tx.type === 'payment_in') delta = -tx.amount;
        if (tx.type === 'payment_out') delta = tx.amount;
        await this.persistParty({
          ...party,
          balance: party.balance - delta,
          updated_at: ts,
        });
      }
    }

    const biz = await this.getBusiness(tx.business_id);
    if (biz) {
      let cash = biz.cash_in_hand;
      if (!tx.is_credit && tx.type === 'sale') cash -= tx.amount;
      if (tx.type === 'payment_in') cash -= tx.amount;
      if (['purchase', 'payment_out', 'expense'].includes(tx.type)) cash += tx.amount;
      await db.runAsync(
        `UPDATE businesses SET cash_in_hand=?, updated_at=?, sync_status='pending' WHERE id=?`,
        [cash, ts, biz.id],
      );
    }

    await db.runAsync(
      `UPDATE transactions SET deleted_at=?, updated_at=?, sync_status='pending' WHERE id=?`,
      [ts, ts, id],
    );
    this.syncState = 'pending';
  }

  async getExpenseCategories(businessId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM expense_categories
       WHERE (business_id IS NULL OR business_id = ?) AND deleted_at IS NULL
       ORDER BY sort_order ASC`,
      [businessId],
    );
    return rows.map((r) => this.mapExpenseCategory(r));
  }

  async getLineItems(businessId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT li.* FROM line_items li
       JOIN transactions t ON t.id = li.transaction_id
       WHERE t.business_id = ? AND li.deleted_at IS NULL AND t.deleted_at IS NULL`,
      [businessId],
    );
    return rows.map((r) => this.mapLineItem(r));
  }

  async getLoans(businessId: string, status?: Parameters<IDataRepository['getLoans']>[1]) {
    const db = await this.db();
    if (status) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM loans WHERE business_id = ? AND status = ? AND deleted_at IS NULL ORDER BY next_due_date ASC',
        [businessId, status],
      );
      return rows.map((r) => this.mapLoan(r));
    }
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM loans WHERE business_id = ? AND deleted_at IS NULL ORDER BY next_due_date ASC',
      [businessId],
    );
    return rows.map((r) => this.mapLoan(r));
  }

  async createLoan(businessId: string, input: LoanInput) {
    const loan = await this.fallback.createLoan(businessId, input);
    const plan = loan.principal > 0 && loan.total_installments > 0 ? generateInstallmentPlan(loan) : [];
    if (plan.length > 0) loan.next_due_date = plan[0].due_date;
    await this.persistLoan(loan);
    for (const p of plan) {
      await this.persistInstallment({
        id: uuid(),
        loan_id: loan.id,
        amount: p.amount,
        due_date: p.due_date,
        paid_at: null,
        is_paid: false,
        paid_amount: 0,
        created_at: nowISO(),
        updated_at: nowISO(),
        deleted_at: null,
      });
    }
    return loan;
  }

  async getInstallments(loanId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM installments WHERE loan_id = ? AND deleted_at IS NULL ORDER BY due_date ASC',
      [loanId],
    );
    return rows.map((r) => this.mapInstallment(r));
  }

  async getLoanPayments(businessId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT lp.* FROM loan_payments lp
       JOIN loans l ON l.id = lp.loan_id
       WHERE l.business_id = ? AND lp.deleted_at IS NULL
       ORDER BY lp.paid_on DESC`,
      [businessId],
    );
    return rows.map((r) => this.mapLoanPayment(r));
  }

  async payInstallment(loanId: string, amount?: number, paidOn?: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM loans WHERE id = ? AND deleted_at IS NULL',
      [loanId],
    );
    if (!row) return this.fallback.payInstallment(loanId, amount ?? 0, paidOn);

    const loan = this.mapLoan(row);
    const pending = await this.getInstallments(loanId);
    const nextUnpaid = pending.find((i) => !i.is_paid);
    const paidDate = paidOn ?? todayISO();
    const paidAmount = amount ?? nextUnpaid?.amount ?? loan.outstanding;

    if (nextUnpaid) {
      await db.runAsync(
        `UPDATE installments SET is_paid=1, paid_amount=?, paid_at=?, updated_at=?, sync_status='pending' WHERE id=?`,
        [paidAmount, nowISO(), nowISO(), nextUnpaid.id],
      );
      const late = daysLate(nextUnpaid.due_date, paidDate);
      await db.runAsync(
        `INSERT INTO loan_payments (id, loan_id, installment_id, amount, due_date, paid_on, days_late, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [uuid(), loanId, nextUnpaid.id, paidAmount, nextUnpaid.due_date, paidDate, late, nowISO(), nowISO()],
      );
    }

    loan.outstanding = Math.max(0, loan.outstanding - paidAmount);
    loan.paid_installments += 1;
    loan.updated_at = nowISO();

    const remaining = (await this.getInstallments(loanId)).filter((i) => !i.is_paid);
    loan.next_due_date = remaining[0]?.due_date ?? null;
    if (remaining.length === 0 || loan.outstanding <= 0) loan.status = 'paid';

    await this.persistLoan(loan);

    const biz = await this.getBusiness(loan.business_id);
    if (biz) {
      biz.cash_in_hand -= paidAmount;
      biz.updated_at = nowISO();
      await db.runAsync(
        `UPDATE businesses SET cash_in_hand=?, updated_at=?, sync_status='pending' WHERE id=?`,
        [biz.cash_in_hand, biz.updated_at, biz.id],
      );
    }

    this.syncState = 'pending';
    return loan;
  }

  async getDayCloses(businessId: string) {
    const db = await this.db();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM day_closes WHERE business_id = ? AND deleted_at IS NULL ORDER BY close_date DESC',
      [businessId],
    );
    return rows.map((r) => this.mapDayClose(r));
  }

  async createDayClose(
    businessId: string,
    expected: number,
    counted: number,
    note?: string,
  ) {
    const dc = await this.fallback.createDayClose(businessId, expected, counted, note);
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO day_closes (id, business_id, close_date, expected_cash, counted_cash, difference, is_locked, note, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        dc.id,
        dc.business_id,
        dc.close_date,
        dc.expected_cash,
        dc.counted_cash,
        dc.difference,
        dc.is_locked ? 1 : 0,
        dc.note,
        dc.created_at,
        dc.updated_at,
      ],
    );
    this.syncState = 'pending';
    return dc;
  }

  async isDayLocked(businessId: string, date: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM day_closes WHERE business_id = ? AND close_date = ? AND is_locked = 1 AND deleted_at IS NULL',
      [businessId, date],
    );
    return !!row;
  }

  async getDashboard(businessId: string) {
    const biz = await this.getBusiness(businessId);
    const parties = await this.getParties(businessId);
    const products = await this.getProducts(businessId);
    const transactions = await this.getTransactions(businessId);
    const loans = await this.getLoans(businessId);
    return buildDashboard(
      biz?.cash_in_hand ?? 0,
      parties,
      products,
      transactions,
      loans,
      businessId,
    );
  }

  async getReport(businessId: string, rangeDays = 30) {
    const parties = await this.getParties(businessId);
    const transactions = await this.getTransactions(businessId);
    const expenseCategories = await this.getExpenseCategories(businessId);
    const lineItems = await this.getLineItems(businessId);
    const products = await this.getProducts(businessId);
    return buildReport(parties, transactions, businessId, rangeDays, expenseCategories, lineItems, products);
  }

  async getCreditScoreSummary(businessId: string) {
    const [business, transactions, parties, loans, loanPayments, previous] = await Promise.all([
      this.getBusiness(businessId),
      this.getTransactions(businessId),
      this.getParties(businessId),
      this.getLoans(businessId),
      this.getLoanPayments(businessId),
      this.getLatestCreditScoreSnapshot(businessId),
    ]);
    if (!business) throw new Error('Business not found');

    const installmentsByLoan: Record<string, Installment[]> = {};
    for (const loan of loans) {
      installmentsByLoan[loan.id] = await this.getInstallments(loan.id);
    }

    const result = computeCreditScore(
      { business, transactions, parties, loans, loanPayments, installmentsByLoan },
      previous?.drivers ?? [],
    );

    // At most one snapshot per business per day — every screen that shows
    // the score (home, more, credit-score) calls this, and without this
    // guard each view would insert a near-duplicate row. Same-day repeat
    // calls just recompute and return fresh numbers without writing;
    // "previous" then stays anchored to the last *different* day, which
    // is what makes the delta meaningful instead of always reading 0.
    const isNewDay = !previous || previous.computed_at.slice(0, 10) !== todayISO();
    if (isNewDay) {
      await this.saveCreditScoreSnapshot({
        business_id: businessId,
        score: result.score,
        band: result.band,
        confidence: result.confidence,
        dscr: result.dscr,
        drivers: result.components.map((c) => ({ key: c.key, label: c.label, impact: c.points })),
        computed_at: nowISO(),
      });
    }

    return result.summary;
  }

  async getLatestCreditScoreSnapshot(businessId: string) {
    const db = await this.db();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM credit_scores WHERE business_id = ? AND deleted_at IS NULL ORDER BY computed_at DESC LIMIT 1',
      [businessId],
    );
    return row ? this.mapCreditScoreSnapshot(row) : null;
  }

  async saveCreditScoreSnapshot(
    snapshot: Omit<CreditScoreSnapshot, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  ) {
    const db = await this.db();
    const ts = nowISO();
    const row: CreditScoreSnapshot = { id: uuid(), created_at: ts, updated_at: ts, deleted_at: null, ...snapshot };
    await db.runAsync(
      `INSERT INTO credit_scores (id, business_id, score, band, confidence, dscr, drivers, computed_at, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        row.id,
        row.business_id,
        row.score,
        row.band,
        row.confidence,
        row.dscr,
        JSON.stringify(row.drivers),
        row.computed_at,
        row.created_at,
        row.updated_at,
      ],
    );
    this.syncState = 'pending';
    return row;
  }

  async getLearningItems() {
    const db = await this.db();
    let rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM learning_items WHERE deleted_at IS NULL ORDER BY sort_order ASC',
    );
    if (rows.length === 0 && (await isOnline())) {
      try {
        await syncEngine();
      } catch {
        /* fall through */
      }
      rows = await db.getAllAsync<Record<string, unknown>>(
        'SELECT * FROM learning_items WHERE deleted_at IS NULL ORDER BY sort_order ASC',
      );
    }
    if (rows.length === 0) return this.fallback.getLearningItems();
    return rows.map((r) => this.mapLearningItem(r));
  }

  getSyncState(): SyncState {
    return this.syncState;
  }

  async syncNow() {
    if (await isOnline()) {
      await syncEngine();
      this.syncState = 'online';
    } else {
      this.syncState = 'offline';
    }
  }

  async setLanguage(lang: Language) {
    await setMeta('language', lang);
    this.fallback.setLanguage!(lang);
  }

  async getLanguage() {
    const stored = await getMeta('language');
    if (stored === 'bn' || stored === 'en') return stored;
    return this.fallback.getLanguage!();
  }

  private async persistLoan(loan: Loan) {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO loans (id, business_id, lender_name, loan_type, lender_type, principal, outstanding, total_installments, paid_installments, next_due_date, status, interest_rate, interest_type, disbursed_on, first_due_date, frequency, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        loan.id,
        loan.business_id,
        loan.lender_name,
        loan.loan_type,
        loan.lender_type ?? 'personal',
        loan.principal,
        loan.outstanding,
        loan.total_installments,
        loan.paid_installments,
        loan.next_due_date,
        loan.status,
        loan.interest_rate ?? 0,
        loan.interest_type ?? 'flat',
        loan.disbursed_on ?? null,
        loan.first_due_date ?? null,
        loan.frequency ?? 'monthly',
        loan.created_at,
        loan.updated_at,
      ],
    );
    this.syncState = 'pending';
  }

  private async persistInstallment(installment: Installment) {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO installments (id, loan_id, amount, due_date, paid_at, is_paid, paid_amount, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        installment.id,
        installment.loan_id,
        installment.amount,
        installment.due_date,
        installment.paid_at,
        installment.is_paid ? 1 : 0,
        installment.paid_amount ?? 0,
        installment.created_at,
        installment.updated_at,
      ],
    );
  }

  private mapLineItem(row: Record<string, unknown>): LineItem {
    return {
      id: row.id as string,
      transaction_id: row.transaction_id as string,
      product_id: row.product_id as string | null,
      name: row.name as string,
      qty: row.qty as number,
      unit_price: row.unit_price as number,
      total: row.total as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapInstallment(row: Record<string, unknown>): Installment {
    return {
      id: row.id as string,
      loan_id: row.loan_id as string,
      amount: row.amount as number,
      due_date: row.due_date as string,
      paid_at: row.paid_at as string | null,
      is_paid: rowToBool(row.is_paid),
      paid_amount: (row.paid_amount as number) ?? 0,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapLoanPayment(row: Record<string, unknown>): LoanPayment {
    return {
      id: row.id as string,
      loan_id: row.loan_id as string,
      installment_id: row.installment_id as string | null,
      amount: row.amount as number,
      due_date: row.due_date as string,
      paid_on: row.paid_on as string,
      days_late: row.days_late as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapProfile(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      language: row.language as 'bn' | 'en',
      full_name: row.full_name as string | null,
      phone: row.phone as string | null,
      username: (row.username as string | null) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapBusiness(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      owner_id: row.owner_id as string,
      name: row.name as string,
      owner_name: row.owner_name as string,
      business_type: row.business_type as BusinessType,
      district: row.district as string,
      logo_url: row.logo_url as string | null,
      reminder_sms_template: row.reminder_sms_template as string,
      cash_in_hand: row.cash_in_hand as number,
      established_on: (row.established_on as string | null) ?? null,
      trade_license_no: (row.trade_license_no as string | null) ?? null,
      nid_no: (row.nid_no as string | null) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapParty(row: Record<string, unknown>): Party {
    return {
      id: row.id as string,
      business_id: row.business_id as string,
      name: row.name as string,
      phone: row.phone as string | null,
      type: row.type as Party['type'],
      balance: row.balance as number,
      last_activity_at: row.last_activity_at as string | null,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapProduct(row: Record<string, unknown>): Product {
    return {
      id: row.id as string,
      business_id: row.business_id as string,
      category_id: row.category_id as string | null,
      name: row.name as string,
      unit: row.unit as string,
      qty: row.qty as number,
      low_stock_threshold: row.low_stock_threshold as number,
      cost_price: row.cost_price as number,
      sell_price: row.sell_price as number,
      icon_key: row.icon_key as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapTransaction(row: Record<string, unknown>): Transaction {
    return {
      id: row.id as string,
      business_id: row.business_id as string,
      party_id: row.party_id as string | null,
      type: row.type as Transaction['type'],
      amount: row.amount as number,
      payment_method: row.payment_method as Transaction['payment_method'],
      is_credit: rowToBool(row.is_credit),
      note: row.note as string | null,
      transaction_date: row.transaction_date as string,
      running_balance: row.running_balance as number | null,
      expense_category_id: (row.expense_category_id as string | null) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapLoan(row: Record<string, unknown>): Loan {
    return {
      id: row.id as string,
      business_id: row.business_id as string,
      lender_name: row.lender_name as string,
      loan_type: row.loan_type as string,
      lender_type: (row.lender_type as Loan['lender_type']) ?? 'personal',
      principal: row.principal as number,
      outstanding: row.outstanding as number,
      total_installments: row.total_installments as number,
      paid_installments: row.paid_installments as number,
      next_due_date: row.next_due_date as string | null,
      status: row.status as Loan['status'],
      interest_rate: (row.interest_rate as number) ?? 0,
      interest_type: (row.interest_type as Loan['interest_type']) ?? 'flat',
      disbursed_on: row.disbursed_on as string | null,
      first_due_date: row.first_due_date as string | null,
      frequency: (row.frequency as Loan['frequency']) ?? 'monthly',
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapDayClose(row: Record<string, unknown>): DayClose {
    return {
      id: row.id as string,
      business_id: row.business_id as string,
      close_date: row.close_date as string,
      expected_cash: row.expected_cash as number,
      counted_cash: row.counted_cash as number,
      difference: row.difference as number,
      is_locked: rowToBool(row.is_locked),
      note: row.note as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapCreditScoreSnapshot(row: Record<string, unknown>): CreditScoreSnapshot {
    return {
      id: row.id as string,
      business_id: row.business_id as string,
      score: row.score as number,
      band: row.band as CreditScoreSnapshot['band'],
      confidence: row.confidence as CreditScoreSnapshot['confidence'],
      dscr: (row.dscr as number | null) ?? null,
      drivers: JSON.parse((row.drivers as string) || '[]'),
      computed_at: row.computed_at as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapExpenseCategory(row: Record<string, unknown>): ExpenseCategory {
    return {
      id: row.id as string,
      business_id: row.business_id as string | null,
      name_bn: row.name_bn as string,
      name_en: row.name_en as string,
      is_system: rowToBool(row.is_system),
      sort_order: row.sort_order as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }

  private mapLearningItem(row: Record<string, unknown>): LearningItem {
    return {
      id: row.id as string,
      title_bn: row.title_bn as string,
      title_en: row.title_en as string,
      summary_bn: row.summary_bn as string,
      summary_en: row.summary_en as string,
      category: row.category as string,
      sort_order: row.sort_order as number,
      is_new: rowToBool(row.is_new),
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      deleted_at: row.deleted_at as string | null,
    };
  }
}

export const localRepository = new LocalRepository();
