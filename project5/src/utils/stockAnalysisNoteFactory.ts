import type {
  CreateStockAnalysisNoteInput,
  StockAnalysisNote,
  UpdateStockAnalysisNoteInput,
} from '../types/stockAnalysisNote';

export function createStockAnalysisNote(
  input: CreateStockAnalysisNoteInput,
): StockAnalysisNote {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    stockName: input.stockName,
    investmentOpinion: input.investmentOpinion,
    investmentReason: input.investmentReason,
    targetPrice: input.targetPrice,
    memo: input.memo,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateStockAnalysisNote(
  existingStockAnalysisNote: StockAnalysisNote,
  input: UpdateStockAnalysisNoteInput,
): StockAnalysisNote {
  return {
    ...existingStockAnalysisNote,
    stockName: input.stockName,
    investmentOpinion: input.investmentOpinion,
    investmentReason: input.investmentReason,
    targetPrice: input.targetPrice,
    memo: input.memo,
    updatedAt: new Date().toISOString(),
  };
}
