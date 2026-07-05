/** Web stub — SQLite is native-only; meta prefs use localStorage. */

export async function getDatabase(): Promise<never> {
  throw new Error('SQLite is not available on web');
}

export const initDatabase = getDatabase;

function storageKey(key: string) {
  return `aropon_meta_${key}`;
}

export async function getMeta(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(storageKey(key));
  } catch {
    return null;
  }
}

export async function setMeta(key: string, value: string) {
  try {
    localStorage.setItem(storageKey(key), value);
  } catch {
    // ignore
  }
}
