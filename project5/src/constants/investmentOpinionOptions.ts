import type { InvestmentOpinion } from '../types/stockAnalysisNote';

export interface InvestmentOpinionOption {
  value: InvestmentOpinion;
  label: string;
}

export const INVESTMENT_OPINION_OPTIONS = [
  { value: 'BUY', label: '매수' },
  { value: 'HOLD', label: '보유' },
  { value: 'SELL', label: '매도' },
  { value: 'WATCH', label: '관망' },
] satisfies InvestmentOpinionOption[];
