import type { Category } from '@/types/schema';

const CATEGORY_DEFS: { name: string; color: string }[] = [
  { name: 'মুদি', color: '#0e7490' },
  { name: 'তেল', color: '#f59e0b' },
  { name: 'ডাল', color: '#84cc16' },
  { name: 'মসলা', color: '#ef4444' },
  { name: 'পানীয়', color: '#3b82f6' },
  { name: 'অন্যান্য', color: '#6b7280' },
];

export const CATEGORY_ALL_ID = 'all';

export function categoryIdForName(name: string): string {
  return `cat-${name}`;
}

export function buildCategoriesForBusiness(businessId: string): Category[] {
  const now = new Date().toISOString();
  return CATEGORY_DEFS.map((c) => ({
    id: categoryIdForName(c.name),
    business_id: businessId,
    name: c.name,
    color: c.color,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }));
}

export function categoryNameById(categoryId: string | null | undefined): string | null {
  if (!categoryId) return null;
  const found = CATEGORY_DEFS.find((c) => categoryIdForName(c.name) === categoryId);
  return found?.name ?? null;
}
