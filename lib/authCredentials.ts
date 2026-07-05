/** Username/password helpers — internal email mapping for Supabase Auth. */

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const u = normalizeUsername(username);
  if (u.length < 3) return 'ইউজারনেম কমপক্ষে ৩ অক্ষর হতে হবে';
  if (u.length > 32) return 'ইউজারনেম ৩২ অক্ষরের বেশি হতে পারবে না';
  if (!/^[a-z0-9._-]+$/.test(u)) {
    return 'শুধু ইংরেজি অক্ষর, সংখ্যা এবং . _ - ব্যবহার করুন';
  }
  return null;
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@accounts.aropon.app`;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে';
  return null;
}
