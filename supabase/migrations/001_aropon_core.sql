-- Aropon core schema (Stream B)
-- profiles, businesses, parties, products, transactions, loans, day_closes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'bn' CHECK (language IN ('bn', 'en')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'grocery',
  district TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  reminder_sms_template TEXT NOT NULL DEFAULT 'প্রিয় {{name}}, আপনার বাকি ৳{{amount}}। দয়া করে পরিশোধ করুন। — {{shop}}',
  cash_in_hand NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

-- parties
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('customer', 'dealer')),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_parties_business ON parties(business_id);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(14,3) NOT NULL DEFAULT 5,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  icon_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'payment_in', 'payment_out', 'expense')),
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  is_credit BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  running_balance NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_updated ON transactions(updated_at);

-- line_items
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  qty NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- loans
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lender_name TEXT NOT NULL,
  loan_type TEXT NOT NULL DEFAULT 'personal',
  principal NUMERIC(14,2) NOT NULL,
  outstanding NUMERIC(14,2) NOT NULL,
  total_installments INT NOT NULL DEFAULT 1,
  paid_installments INT NOT NULL DEFAULT 0,
  next_due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- installments
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- day_closes
CREATE TABLE IF NOT EXISTS day_closes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  close_date DATE NOT NULL,
  expected_cash NUMERIC(14,2) NOT NULL,
  counted_cash NUMERIC(14,2) NOT NULL,
  difference NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(business_id, close_date)
);

-- learning_items
CREATE TABLE IF NOT EXISTS learning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn TEXT NOT NULL,
  title_en TEXT NOT NULL,
  summary_bn TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 0,
  is_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','businesses','parties','categories','products',
    'transactions','line_items','loans','installments','day_closes','learning_items'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_items ENABLE ROW LEVEL SECURITY;

-- Helper: user owns business
CREATE OR REPLACE FUNCTION user_owns_business(bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = bid AND b.owner_id = auth.uid() AND b.deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (user_id = auth.uid());

-- businesses policies
CREATE POLICY businesses_select ON businesses FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY businesses_insert ON businesses FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY businesses_update ON businesses FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY businesses_delete ON businesses FOR DELETE USING (owner_id = auth.uid());

-- parties policies
CREATE POLICY parties_all ON parties FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY categories_all ON categories FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY products_all ON products FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY transactions_all ON transactions FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY line_items_all ON line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_id AND user_owns_business(t.business_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_id AND user_owns_business(t.business_id)
  ));

CREATE POLICY loans_all ON loans FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY installments_all ON installments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = loan_id AND user_owns_business(l.business_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = loan_id AND user_owns_business(l.business_id)
  ));

CREATE POLICY day_closes_all ON day_closes FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY learning_items_select ON learning_items FOR SELECT USING (deleted_at IS NULL);

-- Storage bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY business_logos_select ON storage.objects FOR SELECT USING (bucket_id = 'business-logos');
CREATE POLICY business_logos_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-logos' AND auth.role() = 'authenticated');
CREATE POLICY business_logos_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');
CREATE POLICY business_logos_delete ON storage.objects FOR DELETE
  USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

-- Seed learning items
INSERT INTO learning_items (title_bn, title_en, summary_bn, summary_en, category, sort_order, is_new) VALUES
  ('বাকি হিসাব রাখা', 'Credit tracking', 'খদ্দেরদের বাকি সহজে ট্র্যাক করুন', 'Track customer credit easily', 'khata', 1, true),
  ('দিন শেষের হিসাব', 'Day close', 'প্রতিদিন ক্যাশ মিলিয়ে নিন', 'Reconcile cash daily', 'accounting', 2, false),
  ('স্টক ম্যানেজমেন্ট', 'Stock management', 'কম স্টকে সতর্কতা পান', 'Get low stock alerts', 'inventory', 3, false)
ON CONFLICT DO NOTHING;
