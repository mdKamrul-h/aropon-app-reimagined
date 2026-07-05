import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('aropon.db');
    await migrate(db);
  }
  return db;
}

export const initDatabase = getDatabase;

async function migrate(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL DEFAULT 'bn',
      full_name TEXT,
      phone TEXT,
      username TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      district TEXT NOT NULL,
      logo_url TEXT,
      reminder_sms_template TEXT NOT NULL,
      cash_in_hand REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      last_activity_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      category_id TEXT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL NOT NULL DEFAULT 5,
      cost_price REAL NOT NULL DEFAULT 0,
      sell_price REAL NOT NULL DEFAULT 0,
      icon_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      party_id TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      is_credit INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      transaction_date TEXT NOT NULL,
      running_balance REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      lender_name TEXT NOT NULL,
      loan_type TEXT NOT NULL,
      lender_type TEXT NOT NULL DEFAULT 'personal',
      principal REAL NOT NULL,
      outstanding REAL NOT NULL,
      total_installments INTEGER NOT NULL,
      paid_installments INTEGER NOT NULL DEFAULT 0,
      next_due_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS day_closes (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      close_date TEXT NOT NULL,
      expected_cash REAL NOT NULL,
      counted_cash REAL NOT NULL,
      difference REAL NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      UNIQUE(business_id, close_date)
    );

    CREATE INDEX IF NOT EXISTS idx_parties_business ON parties(business_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_updated ON transactions(updated_at);
    CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);

    CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      paid_at TEXT,
      is_paid INTEGER NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS loan_payments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      installment_id TEXT,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      paid_on TEXT NOT NULL,
      days_late INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      business_id TEXT,
      name_bn TEXT NOT NULL,
      name_en TEXT NOT NULL,
      is_system INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS credit_scores (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      band TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'preliminary',
      dscr REAL,
      drivers TEXT NOT NULL DEFAULT '[]',
      computed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
    CREATE INDEX IF NOT EXISTS idx_expense_categories_business ON expense_categories(business_id);
    CREATE INDEX IF NOT EXISTS idx_credit_scores_business ON credit_scores(business_id);

    CREATE TABLE IF NOT EXISTS learning_items (
      id TEXT PRIMARY KEY,
      title_bn TEXT NOT NULL,
      title_en TEXT NOT NULL,
      summary_bn TEXT NOT NULL,
      summary_en TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_new INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_installments_loan ON installments(loan_id);
    CREATE INDEX IF NOT EXISTS idx_installments_updated ON installments(updated_at);
  `);

  await addColumnIfMissing(database, 'profiles', 'username', 'TEXT');

  await addColumnIfMissing(database, 'businesses', 'established_on', 'TEXT');
  await addColumnIfMissing(database, 'businesses', 'trade_license_no', 'TEXT');
  await addColumnIfMissing(database, 'businesses', 'nid_no', 'TEXT');

  await addColumnIfMissing(database, 'transactions', 'expense_category_id', 'TEXT');

  await addColumnIfMissing(database, 'loans', 'lender_type', "TEXT NOT NULL DEFAULT 'personal'");
  await addColumnIfMissing(database, 'loans', 'interest_rate', 'REAL NOT NULL DEFAULT 0');
  await addColumnIfMissing(database, 'loans', 'interest_type', "TEXT NOT NULL DEFAULT 'flat'");
  await addColumnIfMissing(database, 'loans', 'disbursed_on', 'TEXT');
  await addColumnIfMissing(database, 'loans', 'first_due_date', 'TEXT');
  await addColumnIfMissing(database, 'loans', 'frequency', "TEXT NOT NULL DEFAULT 'monthly'");

  await addColumnIfMissing(database, 'installments', 'paid_amount', 'REAL NOT NULL DEFAULT 0');

  await seedExpenseCategories(database);
}

/** Same fixed IDs as supabase/migrations/008_expense_categories.sql so the
 * system categories reconcile as the same row instead of duplicating on sync. */
async function seedExpenseCategories(database: SQLite.SQLiteDatabase) {
  const existing = await database.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM expense_categories WHERE is_system = 1',
  );
  if ((existing?.n ?? 0) > 0) return;

  const now = new Date().toISOString();
  const rows: [string, string, string, number][] = [
    ['00000000-0000-0000-0000-000000000001', 'দোকান ভাড়া', 'Shop rent', 1],
    ['00000000-0000-0000-0000-000000000002', 'বিদ্যুৎ বিল', 'Electricity', 2],
    ['00000000-0000-0000-0000-000000000003', 'পরিবহন', 'Transport', 3],
    ['00000000-0000-0000-0000-000000000004', 'বেতন', 'Salary', 4],
    ['00000000-0000-0000-0000-000000000005', 'মেরামত', 'Repairs', 5],
    ['00000000-0000-0000-0000-000000000006', 'অন্যান্য', 'Other', 6],
  ];
  for (const [id, nameBn, nameEn, sortOrder] of rows) {
    await database.runAsync(
      `INSERT OR IGNORE INTO expense_categories (id, business_id, name_bn, name_en, is_system, sort_order, created_at, updated_at, sync_status)
       VALUES (?, NULL, ?, ?, 1, ?, ?, ?, 'synced')`,
      [id, nameBn, nameEn, sortOrder, now, now],
    );
  }
}

async function addColumnIfMissing(
  database: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  ddl: string,
) {
  const cols = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

export async function getMeta(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string) {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
    [key, value],
  );
}
