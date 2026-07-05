import type { Business } from '@/types/schema';

export function formatBusinessLocation(business: Pick<Business, 'address' | 'district'>): string {
  const parts = [business.address, business.district]
    .map((p) => p?.trim())
    .filter((p) => p && p !== '—');
  return parts.join(', ') || '—';
}
