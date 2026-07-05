import type { Session } from '@supabase/supabase-js';
import type { Business, Profile } from '@/types/schema';
import { nowISO } from '@/utils/bn-numerals';
import { normalizePhone, verifyOtp } from './supabase';

export const DEV_MOCK_USER_ID = 'mock-user-001';

const DEV_MOCK_BUSINESS: Business = {
  id: 'biz-001',
  owner_id: DEV_MOCK_USER_ID,
  name: 'করিম স্টোর',
  owner_name: 'করিম উদ্দিন',
  business_type: 'grocery',
  district: 'ঢাকা',
  logo_url: null,
  reminder_sms_template:
    'প্রিয় {{name}}, আপনার বাকি ৳{{amount}}। দয়া করে পরিশোধ করুন। — {{shop}}',
  cash_in_hand: 42350,
  created_at: nowISO(),
  updated_at: nowISO(),
  deleted_at: null,
};

const DEV_MOCK_PROFILE: Profile = {
  id: 'profile-dev-001',
  user_id: DEV_MOCK_USER_ID,
  language: 'bn',
  full_name: 'করিম উদ্দিন',
  phone: '+8801700000000',
  username: 'karimstore',
  created_at: nowISO(),
  updated_at: nowISO(),
  deleted_at: null,
};

/** Dev-only: skip phone/OTP and open app with mock shop data. */
export function isDevSkipAuthEnabled(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_OTP === 'true';
}

/** @deprecated use isDevSkipAuthEnabled */
export const isDevBypassOtpEnabled = isDevSkipAuthEnabled;

export function getDevMockBusiness(): Business {
  return { ...DEV_MOCK_BUSINESS };
}

export function getDevMockProfile(): Profile {
  return { ...DEV_MOCK_PROFILE };
}

export function createDevMockSession(): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'dev-mock-token',
    refresh_token: 'dev-mock-refresh',
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user: {
      id: DEV_MOCK_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: undefined,
      phone: '+8801700000000',
      app_metadata: { provider: 'phone', providers: ['phone'] },
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      factors: undefined,
      identities: [],
    },
  } as Session;
}

export function getDevTestPhone(fallbackPhone?: string): string {
  const raw = process.env.EXPO_PUBLIC_DEV_TEST_PHONE ?? fallbackPhone ?? '01700000000';
  return normalizePhone(raw);
}

export function getDevTestOtp(): string {
  return process.env.EXPO_PUBLIC_DEV_TEST_OTP ?? '123456';
}

/** Optional: sign in via Supabase test phone (if configured in Dashboard). */
export async function devBypassSignIn(fallbackPhone?: string) {
  const phone = getDevTestPhone(fallbackPhone);
  const token = getDevTestOtp();
  return verifyOtp(phone, token);
}
