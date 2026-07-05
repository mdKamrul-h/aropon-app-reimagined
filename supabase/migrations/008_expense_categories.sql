-- Structured expense categories, replacing free-text-note parsing in
-- reportBuilder/IncomeExpensePanel. business_id is nullable so a shared set
-- of system categories can be seeded once and reused by every business,
-- alongside business-specific custom categories.

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_business ON expense_categories(business_id);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS expense_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL;

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY expense_categories_select ON expense_categories FOR SELECT
  USING (is_system OR user_owns_business(business_id));
CREATE POLICY expense_categories_insert ON expense_categories FOR INSERT
  WITH CHECK (NOT is_system AND user_owns_business(business_id));
CREATE POLICY expense_categories_update ON expense_categories FOR UPDATE
  USING (NOT is_system AND user_owns_business(business_id));
CREATE POLICY expense_categories_delete ON expense_categories FOR DELETE
  USING (NOT is_system AND user_owns_business(business_id));

DROP TRIGGER IF EXISTS trg_expense_categories_updated ON expense_categories;
CREATE TRIGGER trg_expense_categories_updated BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fixed IDs (shared with the SQLite seed in lib/db/database.ts) so system
-- categories reconcile as the same row on sync instead of duplicating.
INSERT INTO expense_categories (id, business_id, name_bn, name_en, is_system, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'দোকান ভাড়া', 'Shop rent', true, 1),
  ('00000000-0000-0000-0000-000000000002', NULL, 'বিদ্যুৎ বিল', 'Electricity', true, 2),
  ('00000000-0000-0000-0000-000000000003', NULL, 'পরিবহন', 'Transport', true, 3),
  ('00000000-0000-0000-0000-000000000004', NULL, 'বেতন', 'Salary', true, 4),
  ('00000000-0000-0000-0000-000000000005', NULL, 'মেরামত', 'Repairs', true, 5),
  ('00000000-0000-0000-0000-000000000006', NULL, 'অন্যান্য', 'Other', true, 6)
ON CONFLICT (id) DO NOTHING;
