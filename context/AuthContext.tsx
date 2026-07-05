import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { appRepository } from '@/lib/repository/appRepository';
import {
  createDevMockSession,
  getDevMockBusiness,
  getDevMockProfile,
  isDevSkipAuthEnabled,
} from '@/lib/devAuth';
import { mockRepository } from '@/lib/mock/MockRepository';
import { getSession, signOut, supabase } from '@/lib/supabase';
import type { Business, Language, Profile } from '@/types/schema';

async function loadUserProfile(userId: string): Promise<Profile | null> {
  const local = await appRepository.getProfile(userId);
  if (local?.username) return local;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return local;

  const remote: Profile = {
    id: data.id,
    user_id: data.user_id,
    language: data.language,
    full_name: data.full_name,
    phone: data.phone,
    username: data.username ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
  };

  return appRepository.upsertProfile(remote);
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  language: Language;
  isDevPreview: boolean;
  setLanguage: (lang: Language) => void;
  setProfile: (p: Profile | null) => void;
  setBusiness: (b: Business | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const devPreview = isDevSkipAuthEnabled();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [sessionLoading, setSessionLoading] = useState(!devPreview);
  const [profileLoading, setProfileLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('bn');

  useEffect(() => {
    if (devPreview) {
      void mockRepository.init();
      setSession(createDevMockSession());
      setProfile(getDevMockProfile());
      setBusiness(getDevMockBusiness());
      setSessionLoading(false);
      return;
    }

    getSession().then((s) => {
      setSession(s);
      setSessionLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [devPreview]);

  useEffect(() => {
    if (devPreview || !session?.user?.id) {
      if (!session?.user?.id && !devPreview) {
        setProfile(null);
        setBusiness(null);
        setProfileLoading(false);
      }
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      const prof = await loadUserProfile(session.user.id);
      const businesses = await appRepository.getBusinesses(session.user.id);
      if (cancelled) return;
      setProfile(prof);
      setBusiness(businesses[0] ?? null);
      setProfileLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [devPreview, session?.user?.id]);

  const loading = devPreview ? false : sessionLoading || (!!session?.user?.id && profileLoading);

  const value = useMemo(
    () => ({
      session,
      profile,
      business,
      loading,
      language,
      isDevPreview: devPreview,
      setLanguage,
      setProfile,
      setBusiness,
      logout: async () => {
        setProfileLoading(false);
        setSession(null);
        setProfile(null);
        setBusiness(null);
        if (devPreview) {
          router.replace('/(auth)/login');
          return;
        }
        try {
          await signOut();
        } catch {
          /* clear local session even if remote sign-out fails */
        }
        router.replace('/(auth)/login');
      },
    }),
    [session, profile, business, loading, language, devPreview],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
