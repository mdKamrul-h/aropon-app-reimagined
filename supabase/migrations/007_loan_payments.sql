-- Real repayment history. installments already tracks the schedule; this
-- table records what actually happened when an installment was paid, so
-- on-time/late can be computed from fact instead of assumed.

CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES installments(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_on DATE NOT NULL,
  days_late INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_updated ON loan_payments(updated_at);

ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY loan_payments_all ON loan_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = loan_id AND user_owns_business(l.business_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM loans l
    WHERE l.id = loan_id AND user_owns_business(l.business_id)
  ));

DROP TRIGGER IF EXISTS trg_loan_payments_updated ON loan_payments;
CREATE TRIGGER trg_loan_payments_updated BEFORE UPDATE ON loan_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
