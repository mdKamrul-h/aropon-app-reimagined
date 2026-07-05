-- Indexes for installment sync pulls
CREATE INDEX IF NOT EXISTS idx_installments_loan ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_updated ON installments(updated_at);
