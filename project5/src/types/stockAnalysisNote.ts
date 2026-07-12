export type InvestmentOpinion = 'BUY' | 'HOLD' | 'SELL' | 'WATCH';

export interface StockAnalysisNote {
  id: string;
  stockName: string;
  investmentOpinion: InvestmentOpinion;
  investmentReason: string;
  targetPrice: number | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockAnalysisNoteFormValues {
  stockName: string;
  investmentOpinion: InvestmentOpinion | '';
  investmentReason: string;
  targetPrice: string;
  memo: string;
}

export interface StockAnalysisNoteFormErrors {
  stockName?: string;
  investmentOpinion?: string;
  investmentReason?: string;
  targetPrice?: string;
  memo?: string;
}

export interface StockAnalysisNoteValidationResult {
  isValid: boolean;
  errors: StockAnalysisNoteFormErrors;
}

export interface CreateStockAnalysisNoteInput {
  stockName: string;
  investmentOpinion: InvestmentOpinion;
  investmentReason: string;
  targetPrice: number | null;
  memo: string | null;
}

export interface UpdateStockAnalysisNoteInput {
  stockName: string;
  investmentOpinion: InvestmentOpinion;
  investmentReason: string;
  targetPrice: number | null;
  memo: string | null;
}

export interface StockAnalysisNoteStorageData {
  schemaVersion: 1;
  stockAnalysisNotes: StockAnalysisNote[];
}

export interface StockAnalysisNoteStorageLoadResult {
  stockAnalysisNotes: StockAnalysisNote[];
  errorMessage: string | null;
}

export interface StockAnalysisNoteStorageSaveResult {
  isSuccessful: boolean;
  errorMessage: string | null;
}
