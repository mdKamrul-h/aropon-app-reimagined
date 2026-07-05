-- Username for password login (returning users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (lower(username))
  WHERE username IS NOT NULL AND deleted_at IS NULL;

-- Public username availability check (signup only)
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE lower(username) = lower(trim(p_username))
      AND deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION is_username_available(TEXT) TO anon, authenticated;
