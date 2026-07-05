-- Real loan terms: interest, disbursement/due dates, repayment frequency.
-- Needed so installment schedules and true cost-of-borrowing can be computed
-- instead of synthesized/back-dated in the app.

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_type TEXT NOT NULL DEFAULT 'flat'
    CHECK (interest_type IN ('flat', 'reducing', 'none')),
  ADD COLUMN IF NOT EXISTS disbursed_on DATE,
  ADD COLUMN IF NOT EXISTS first_due_date DATE,
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly', 'monthly'));
