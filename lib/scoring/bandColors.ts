import type { CreditScoreBandColor } from '@/types/creditScore';
import { colors } from '@/constants/theme';

export function bandColorToken(color: CreditScoreBandColor): string {
  switch (color) {
    case 'green':
      return colors.receive;
    case 'teal':
      return colors.brand;
    case 'amber':
      return colors.amber;
    case 'orange':
      return '#F97316';
    case 'red':
      return colors.pay;
    default:
      return colors.brand;
  }
}

/** Lighter band stroke/text for dark or tinted backgrounds */
export function bandColorOnDark(color: CreditScoreBandColor): string {
  switch (color) {
    case 'green':
      return '#4ade80';
    case 'teal':
      return '#2dd4bf';
    case 'amber':
      return '#fbbf24';
    case 'orange':
      return '#fb923c';
    case 'red':
      return '#fb7185';
    default:
      return '#2dd4bf';
  }
}

export function confidenceLabelBn(
  confidence: 'preliminary' | 'building' | 'verified',
): string {
  switch (confidence) {
    case 'preliminary':
      return 'প্রাথমিক';
    case 'building':
      return 'গড়ে উঠছে';
    case 'verified':
      return 'যাচাইকৃত';
  }
}

export function confidenceLabelEn(
  confidence: 'preliminary' | 'building' | 'verified',
): string {
  switch (confidence) {
    case 'preliminary':
      return 'Preliminary';
    case 'building':
      return 'Building';
    case 'verified':
      return 'Verified';
  }
}
