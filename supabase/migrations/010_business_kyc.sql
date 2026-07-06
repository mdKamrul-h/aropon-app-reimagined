-- Optional KYC fields for the lender-facing loan-readiness report cover page.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS established_on DATE,
  ADD COLUMN IF NOT EXISTS trade_license_no TEXT,
  ADD COLUMN IF NOT EXISTS nid_no TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;
