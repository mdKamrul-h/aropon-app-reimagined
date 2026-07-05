const DEFAULT_TEMPLATE =
  'প্রিয় {{name}}, আপনার বাকি ৳{{amount}}। দয়া করে পরিশোধ করুন। — {{shop}}';

export function buildReminderSms(
  template: string | null | undefined,
  params: { name: string; amount: number; shop: string },
): string {
  const tpl = template?.trim() || DEFAULT_TEMPLATE;
  return tpl
    .replace(/\{\{name\}\}/g, params.name)
    .replace(/\{\{amount\}\}/g, String(Math.abs(Math.round(params.amount))))
    .replace(/\{\{shop\}\}/g, params.shop);
}

/** @deprecated use buildReminderSms */
export const formatReminderSms = buildReminderSms;

export function reminderSmsUrl(phone: string, body: string): string {
  return `sms:${phone}?body=${encodeURIComponent(body)}`;
}
