-- line_items existed since 001 but was never actually written to by the
-- app (transaction/[mode].tsx built line items but createTransaction
-- silently dropped them). Now that they're persisted, index the lookup
-- path used for per-product sales analytics and COGS reporting.

CREATE INDEX IF NOT EXISTS idx_line_items_transaction ON line_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_line_items_updated ON line_items(updated_at);
