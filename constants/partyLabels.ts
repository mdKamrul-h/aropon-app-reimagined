import type { PartyType } from '@/types/schema';

export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  customer: 'গ্রাহক',
  dealer: 'সাপ্লায়ার',
};

export function partyTypeLabel(type: PartyType): string {
  return PARTY_TYPE_LABELS[type];
}

export function partyTypeSelectHint(type: PartyType): string {
  return type === 'dealer' ? 'সাপ্লায়ার বেছে নিন' : 'গ্রাহক বেছে নিন';
}

export function partyTypeEmptyTitle(type: PartyType): string {
  return type === 'customer' ? 'কোনো গ্রাহক নেই' : 'কোনো সাপ্লায়ার নেই';
}

export function partyTypeNewTitle(type: PartyType): string {
  return type === 'customer' ? 'নতুন গ্রাহক' : 'নতুন সাপ্লায়ার';
}
