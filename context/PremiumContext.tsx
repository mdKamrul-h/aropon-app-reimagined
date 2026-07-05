import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = 'aropon_premium';

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  unlock: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PREMIUM_KEY)
      .then((v) => setIsPremium(v === '1'))
      .finally(() => setLoading(false));
  }, []);

  const unlock = useCallback(async () => {
    await AsyncStorage.setItem(PREMIUM_KEY, '1');
    setIsPremium(true);
  }, []);

  const value = useMemo(
    () => ({ isPremium, loading, unlock }),
    [isPremium, loading, unlock],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
