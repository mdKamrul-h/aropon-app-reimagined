-- Loan source type for NGO/MFI credit score eligibility
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS lender_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (lender_type IN ('bank', 'mfi', 'personal'));
