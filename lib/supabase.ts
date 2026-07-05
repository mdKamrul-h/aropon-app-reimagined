import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { normalizeUsername, usernameToAuthEmail } from './authCredentials';
import { authStorage } from './authStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) return `+${digits}`;
  if (digits.startsWith('0')) return `+88${digits}`;
  return `+880${digits}`;
}

export async function sendOtp(phone: string) {
  return supabase.auth.signInWithOtp({
    phone: normalizePhone(phone),
    options: { channel: 'sms' },
  });
}

export async function verifyOtp(phone: string, token: string) {
  return supabase.auth.verifyOtp({
    phone: normalizePhone(phone),
    token,
    type: 'sms',
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithUsername(username: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: usernameToAuthEmail(username),
    password,
  });
}

export async function isUsernameAvailable(username: string) {
  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: normalizeUsername(username),
  });
  if (error) throw error;
  return data === true;
}

/** After phone OTP verify — attach username + password to the auth user. */
export async function completeRegistrationCredentials(username: string, password: string) {
  const normalized = normalizeUsername(username);
  return supabase.auth.updateUser({
    email: usernameToAuthEmail(normalized),
    password,
    data: { username: normalized },
  });
}

export async function fetchProfileUsername(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.username ?? null;
}
