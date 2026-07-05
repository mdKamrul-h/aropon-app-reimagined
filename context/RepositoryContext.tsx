import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appRepository } from '@/lib/repository/appRepository';
import { isDevSkipAuthEnabled } from '@/lib/devAuth';
import { mockRepository } from '@/lib/mock/MockRepository';
import type { IDataRepository, SyncState } from '@/lib/repository/types';

interface RepositoryContextValue {
  repo: IDataRepository;
  syncState: SyncState;
  refreshSync: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>('offline');
  const repo = isDevSkipAuthEnabled() ? mockRepository : appRepository;

  useEffect(() => {
    repo.init().then(() => setSyncState(repo.getSyncState()));
  }, [repo]);

  const refreshSync = async () => {
    await repo.syncNow?.();
    setSyncState(repo.getSyncState());
  };

  const value = useMemo(
    () => ({ repo, syncState, refreshSync }),
    [repo, syncState],
  );

  return (
    <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
  );
}

export function useRepository() {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepository must be used within RepositoryProvider');
  return ctx;
}
