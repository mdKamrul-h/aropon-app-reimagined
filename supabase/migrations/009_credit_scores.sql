-- Snapshots of the (real, rule-based) credit score over time, so the score
-- screen can show genuine "what changed since last time" instead of a
-- static mock delta.

CREATE TABLE IF NOT EXISTS credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  score INT NOT NULL,
  band TEXT NOT NULL CHECK (band IN ('poor', 'fair', 'good', 'very_good', 'excellent')),
  confidence TEXT NOT NULL DEFAULT 'preliminary'
    CHECK (confidence IN ('preliminary', 'building', 'verified')),
  dscr NUMERIC(6,3),
  drivers JSONB NOT NULL DEFAULT '[]'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_business ON credit_scores(business_id, computed_at DESC);

ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_scores_all ON credit_scores FOR ALL
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

DROP TRIGGER IF EXISTS trg_credit_scores_updated ON credit_scores;
CREATE TRIGGER trg_credit_scores_updated BEFORE UPDATE ON credit_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
