/**
 * Seed demo user (username/password, phone OTP verified).
 * Run: npm run seed:demo
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const paths = [join(__dirname, '../.env'), join(__dirname, '../../supabase/.env')];
  const env = {};
  for (const envPath of paths) {
    try {
      const raw = readFileSync(envPath, 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) env[m[1].trim()] = m[2].trim();
      }
    } catch {
      /* optional file */
    }
  }
  return env;
}

const DEMO = {
  username: 'karimstore',
  password: 'demo1234',
  phone: '+8801700000000',
  email: 'karimstore@accounts.aropon.app',
  fullName: 'করিম উদ্দিন',
  businessName: 'করিম স্টোর',
  district: 'ঢাকা',
  cashInHand: 42350,
};

const env = loadEnv();
const url = env.SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in supabase/.env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureAuthUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO.email,
    password: DEMO.password,
    email_confirm: true,
    phone: DEMO.phone,
    phone_confirm: true,
    user_metadata: { username: DEMO.username },
  });

  if (!error) {
    console.log('Created auth user:', data.user.id);
    return data.user.id;
  }

  if (!/already|registered|exists/i.test(error.message)) throw error;

  const existing = await findUserByEmail(DEMO.email);
  if (!existing) throw new Error(`User exists but not found: ${error.message}`);

  const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
    password: DEMO.password,
    email_confirm: true,
    phone: DEMO.phone,
    phone_confirm: true,
    user_metadata: { ...existing.user_metadata, username: DEMO.username },
  });
  if (updateErr) throw updateErr;

  console.log('Updated existing auth user:', existing.id);
  return existing.id;
}

async function seedDemoData(userId) {
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        language: 'bn',
        full_name: DEMO.fullName,
        phone: DEMO.phone,
        username: DEMO.username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('id')
    .single();
  if (profileErr) throw profileErr;

  const { data: existingBiz } = await admin
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  let businessId = existingBiz?.id;

  if (businessId) {
    const { error: updateErr } = await admin
      .from('businesses')
      .update({
        name: DEMO.businessName,
        owner_name: DEMO.fullName,
        cash_in_hand: DEMO.cashInHand,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);
    if (updateErr) throw updateErr;
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from('businesses')
      .insert({
        owner_id: userId,
        name: DEMO.businessName,
        owner_name: DEMO.fullName,
        business_type: 'grocery',
        district: DEMO.district,
        cash_in_hand: DEMO.cashInHand,
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    businessId = inserted.id;
  }

  const today = new Date().toISOString().slice(0, 10);

  await admin.from('transactions').delete().eq('business_id', businessId);
  await admin.from('parties').delete().eq('business_id', businessId);
  await admin.from('products').delete().eq('business_id', businessId);
  await admin.from('loans').delete().eq('business_id', businessId);

  const parties = [
    { name: 'করিম ভাই', phone: '01712345678', type: 'customer', balance: 1250 },
    { name: 'সালমা বেগম', phone: '01812345678', type: 'customer', balance: -200 },
    { name: 'রহিম ট্রেডার্স', phone: '01912345678', type: 'dealer', balance: -9500 },
  ];

  const { data: insertedParties, error: partiesErr } = await admin
    .from('parties')
    .insert(
      parties.map((p) => ({
        business_id: businessId,
        ...p,
        last_activity_at: new Date().toISOString(),
      })),
    )
    .select('id, name');
  if (partiesErr) throw partiesErr;

  const partyByName = Object.fromEntries(insertedParties.map((p) => [p.name, p.id]));

  const { error: productsErr } = await admin.from('products').insert([
    {
      business_id: businessId,
      name: 'চাল (মিনিকেট)',
      unit: 'কেজি',
      qty: 45,
      low_stock_threshold: 20,
      cost_price: 55,
      sell_price: 62,
      icon_key: 'grocery',
    },
    {
      business_id: businessId,
      name: 'সয়াবিন তেল',
      unit: 'লিটার',
      qty: 3,
      low_stock_threshold: 5,
      cost_price: 165,
      sell_price: 180,
      icon_key: 'grocery',
    },
  ]);
  if (productsErr) throw productsErr;

  const { error: txErr } = await admin.from('transactions').insert([
    {
      business_id: businessId,
      party_id: partyByName['করিম ভাই'],
      type: 'sale',
      amount: 350,
      payment_method: 'cash',
      is_credit: true,
      note: 'বাকি বিক্রি',
      transaction_date: today,
      running_balance: 1250,
    },
    {
      business_id: businessId,
      type: 'expense',
      amount: 3000,
      payment_method: 'cash',
      is_credit: false,
      note: 'দোকান ভাড়া',
      transaction_date: today,
    },
    {
      business_id: businessId,
      party_id: partyByName['সালমা বেগম'],
      type: 'payment_in',
      amount: 200,
      payment_method: 'bkash',
      is_credit: false,
      note: 'টাকা আদায়',
      transaction_date: today,
      running_balance: -200,
    },
  ]);
  if (txErr) throw txErr;

  const { data: loan, error: loanErr } = await admin
    .from('loans')
    .insert({
      business_id: businessId,
      lender_name: 'ব্র্যাক ব্যাংক',
      loan_type: 'ব্যবসায়িক',
      principal: 50000,
      outstanding: 35000,
      total_installments: 12,
      paid_installments: 5,
      next_due_date: today,
      status: 'active',
    })
    .select('id')
    .single();
  if (loanErr) throw loanErr;

  console.log('Seeded profile, business, parties, products, transactions, loan.');
  console.log('Profile id:', profile.id);
  console.log('Business id:', businessId);
  console.log('Loan id:', loan.id);
}

console.log('Seeding Aropon demo user…');
const userId = await ensureAuthUser();
await seedDemoData(userId);
console.log('\nDemo login credentials:');
console.log(`  Username: ${DEMO.username}`);
console.log(`  Password: ${DEMO.password}`);
console.log(`  Phone:    ${DEMO.phone} (OTP verified)`);
