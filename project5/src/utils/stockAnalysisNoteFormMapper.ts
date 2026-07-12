import type {
  CreateStockAnalysisNoteInput,
  InvestmentOpinion,
  StockAnalysisNote,
  StockAnalysisNoteFormValues,
} from '../types/stockAnalysisNote';

export const INITIAL_STOCK_ANALYSIS_NOTE_FORM_VALUES: StockAnalysisNoteFormValues =
  {
    stockName: '',
    investmentOpinion: '',
    investmentReason: '',
    targetPrice: '',
    memo: '',
  };

const INVESTMENT_OPINIONS: InvestmentOpinion[] = ['BUY', 'HOLD', 'SELL', 'WATCH'];

function isInvestmentOpinion(
  investmentOpinion: StockAnalysisNoteFormValues['investmentOpinion'],
): investmentOpinion is InvestmentOpinion {
  return INVESTMENT_OPINIONS.some(
    (validInvestmentOpinion) => validInvestmentOpinion === investmentOpinion,
  );
}

export function normalizeStockAnalysisNoteFormValues(
  formValues: StockAnalysisNoteFormValues,
): CreateStockAnalysisNoteInput | null {
  if (!isInvestmentOpinion(formValues.investmentOpinion)) {
    return null;
  }

  const trimmedTargetPrice = formValues.targetPrice.trim();
  const trimmedMemo = formValues.memo.trim();

  return {
    stockName: formValues.stockName.trim(),
    investmentOpinion: formValues.investmentOpinion,
    investmentReason: formValues.investmentReason.trim(),
    targetPrice: trimmedTargetPrice === '' ? null : Number(trimmedTargetPrice),
    memo: trimmedMemo === '' ? null : trimmedMemo,
  };
}

export function mapStockAnalysisNoteToFormValues(
  stockAnalysisNote: StockAnalysisNote,
): StockAnalysisNoteFormValues {
  return {
    stockName: stockAnalysisNote.stockName,
    investmentOpinion: stockAnalysisNote.investmentOpinion,
    investmentReason: stockAnalysisNote.investmentReason,
    targetPrice:
      stockAnalysisNote.targetPrice === null
        ? ''
        : String(stockAnalysisNote.targetPrice),
    memo: stockAnalysisNote.memo ?? '',
  };
}
