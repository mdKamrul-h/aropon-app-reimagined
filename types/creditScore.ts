export type CreditScoreBandName =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Very Poor';

export type CreditScoreBandColor = 'green' | 'teal' | 'amber' | 'orange' | 'red';

export type CreditScoreConfidence = 'preliminary' | 'building' | 'verified';

export type FlagSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface CreditScoreBand {
  name: CreditScoreBandName;
  color: CreditScoreBandColor;
  label_bn: string;
  label_en: string;
}

export interface CreditScoreFlag {
  message_key: string;
  severity?: FlagSeverity;
  text_bn: string;
  text_en: string;
}

export interface CreditScoreDeltaDriver {
  message_key: string;
  direction: 'up' | 'down';
  text_bn: string;
  text_en: string;
}

export interface CreditScoreDelta {
  value: number;
  previous_score?: number;
  sentence_key: string;
  sentence_bn: string;
  sentence_en: string;
  drivers: CreditScoreDeltaDriver[];
}

export type BindingCap = 'band' | 'dscr' | 'gate';

export interface CreditScoreLever {
  message_key: string;
  points: number;
  text_bn: string;
  text_en: string;
}

export interface CreditScoreRecommendation {
  verdict_key: string;
  verdict_bn: string;
  verdict_en: string;
  limit_bdt: number;
  binding_cap: BindingCap;
  binding_note_bn?: string;
  binding_note_en?: string;
  levers: CreditScoreLever[];
}

export interface CreditScoreSummary {
  score: number;
  band: CreditScoreBand;
  confidence: CreditScoreConfidence;
  percentile: number;
  delta: CreditScoreDelta;
  green_flags: CreditScoreFlag[];
  red_flags: CreditScoreFlag[];
  recommendation: CreditScoreRecommendation;
}
