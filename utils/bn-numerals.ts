const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;
const TAKA_NBSP = '\u00A0';

export function toBnDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatTakaBnAmount(amount: number): string {
  return toBnDigits(Math.abs(amount).toLocaleString('en-IN'));
}

export function formatTaka(amount: number, options?: { showSign?: boolean }): string {
  const prefix =
    options?.showSign && amount > 0 ? '+' : options?.showSign && amount < 0 ? '-' : '';
  return `${prefix}৳${TAKA_NBSP}${formatTakaBnAmount(amount)}`;
}

export function formatBnPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 11) {
    const local = digits.slice(-11);
    return `+৮৮০ ${toBnDigits(local.slice(0, 4))}-${toBnDigits(local.slice(4))}`;
  }
  return toBnDigits(phone);
}

export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) return `+${digits}`;
  if (digits.startsWith('0')) return `+88${digits}`;
  return `+880${digits}`;
}

export function formatBnTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${toBnDigits(m)}:${toBnDigits(String(s).padStart(2, '0'))}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const BN_MONTH_LOCATIVE = [
  'জানুয়ারিতে',
  'ফেব্রুয়ারিতে',
  'মার্চে',
  'এপ্রিলে',
  'মে মাসে',
  'জুনে',
  'জুলাইয়ে',
  'আগস্টে',
  'সেপ্টেম্বরে',
  'অক্টোবরে',
  'নভেম্বরে',
  'ডিসেম্বরে',
] as const;

/** e.g. "জুনে" for use in "জুনে বিক্রি" */
export function getBnMonthLocative(date = new Date()): string {
  return BN_MONTH_LOCATIVE[date.getMonth()];
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
