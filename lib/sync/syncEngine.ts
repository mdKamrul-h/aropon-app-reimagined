import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { getDatabase, getMeta, setMeta } from '@/lib/db/database';

const SYNC_TABLES = [
  'profiles',
  'businesses',
  'parties',
  'products',
  'transactions',
  'loans',
  'installments',
  'loan_payments',
  'expense_categories',
  'credit_scores',
  'day_closes',
  'learning_items',
] as const;

export type SyncResult = { pushed: number; pulled: number; errors: string[] };

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

export type SyncState = 'online' | 'pending' | 'offline';

export async function runSync(_userId?: string): Promise<SyncResult> {
  return syncEngine();
}

export async function getSyncState(): Promise<SyncState> {
  return (await isOnline()) ? 'online' : 'offline';
}

export async function syncEngine(): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: [] };
  if (!(await isOnline())) return result;

  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return result;

  const db = await getDatabase();

  for (const table of SYNC_TABLES) {
    try {
      const pending = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${table} WHERE sync_status = 'pending' AND deleted_at IS NULL LIMIT 50`,
      );

      for (const row of pending) {
        const { sync_status: _, ...payload } = row;
        const { error } = await supabase.from(table).upsert(payload);
        if (error) {
          result.errors.push(`${table}:${row.id}: ${error.message}`);
          await db.runAsync(`UPDATE ${table} SET sync_status = 'error' WHERE id = ?`, [
            row.id as string,
          ]);
        } else {
          await db.runAsync(`UPDATE ${table} SET sync_status = 'synced' WHERE id = ?`, [
            row.id as string,
          ]);
          result.pushed += 1;
        }
      }

      const lastSync = (await getMeta(`last_sync_${table}`)) ?? '1970-01-01T00:00:00.000Z';
      const { data: remote, error: pullError } = await supabase
        .from(table)
        .select('*')
        .gt('updated_at', lastSync)
        .order('updated_at', { ascending: true })
        .limit(100);

      if (pullError) {
        result.errors.push(`pull ${table}: ${pullError.message}`);
        continue;
      }

      for (const row of remote ?? []) {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(', ');
        const updates = cols.map((c) => `${c} = excluded.${c}`).join(', ');
        await db.runAsync(
          `INSERT INTO ${table} (${cols.join(', ')}, sync_status) VALUES (${placeholders}, 'synced')
           ON CONFLICT(id) DO UPDATE SET ${updates}, sync_status = 'synced'`,
          [...cols.map((c) => row[c]), ...cols.map((c) => row[c])],
        );
        result.pulled += 1;
        await setMeta(`last_sync_${table}`, row.updated_at as string);
      }
    } catch (e) {
      result.errors.push(`${table}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}
