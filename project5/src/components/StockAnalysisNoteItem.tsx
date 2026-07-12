import { INVESTMENT_OPINION_OPTIONS } from '../constants/investmentOpinionOptions';
import type { StockAnalysisNote } from '../types/stockAnalysisNote';

interface StockAnalysisNoteItemProps {
  stockAnalysisNote: StockAnalysisNote;
  isEditing: boolean;
  onEditStockAnalysisNote: (stockAnalysisNoteId: string) => void;
  onDeleteStockAnalysisNote: (stockAnalysisNoteId: string) => void;
}

function getInvestmentOpinionLabel(stockAnalysisNote: StockAnalysisNote): string {
  const investmentOpinionOption = INVESTMENT_OPINION_OPTIONS.find(
    (option) => option.value === stockAnalysisNote.investmentOpinion,
  );

  return investmentOpinionOption?.label ?? '알 수 없음';
}

export default function StockAnalysisNoteItem({
  stockAnalysisNote,
  isEditing,
  onEditStockAnalysisNote,
  onDeleteStockAnalysisNote,
}: StockAnalysisNoteItemProps) {
  const investmentOpinionLabel = getInvestmentOpinionLabel(stockAnalysisNote);
  const formattedTargetPrice =
    stockAnalysisNote.targetPrice === null
      ? '미설정'
      : `${stockAnalysisNote.targetPrice.toLocaleString('ko-KR')}원`;
  const displayedMemo = stockAnalysisNote.memo ?? '작성된 메모 없음';
  const formattedCreatedAt = new Date(stockAnalysisNote.createdAt).toLocaleString(
    'ko-KR',
  );
  const formattedUpdatedAt = new Date(stockAnalysisNote.updatedAt).toLocaleString(
    'ko-KR',
  );

  function handleEditButtonClick(): void {
    onEditStockAnalysisNote(stockAnalysisNote.id);
  }

  function handleDeleteButtonClick(): void {
    onDeleteStockAnalysisNote(stockAnalysisNote.id);
  }

  return (
    <article
      className={
        isEditing
          ? 'stock-analysis-note-card stock-analysis-note-item stock-analysis-note-item--editing'
          : 'stock-analysis-note-card stock-analysis-note-item'
      }
    >
      <header className="stock-analysis-note-card__header">
        <h2 className="stock-analysis-note-card__title">
          {stockAnalysisNote.stockName}
        </h2>
        <span className="stock-analysis-note-card__opinion">
          투자 의견: {investmentOpinionLabel}
        </span>
      </header>

      <dl className="stock-analysis-note-card__details">
        <div className="stock-analysis-note-card__detail">
          <dt>투자 판단 근거</dt>
          <dd>{stockAnalysisNote.investmentReason}</dd>
        </div>
        <div className="stock-analysis-note-card__detail">
          <dt>목표가</dt>
          <dd>{formattedTargetPrice}</dd>
        </div>
        <div className="stock-analysis-note-card__detail">
          <dt>메모</dt>
          <dd>{displayedMemo}</dd>
        </div>
        <div className="stock-analysis-note-card__detail">
          <dt>생성일</dt>
          <dd>{formattedCreatedAt}</dd>
        </div>
        <div className="stock-analysis-note-card__detail">
          <dt>최종 수정일</dt>
          <dd>{formattedUpdatedAt}</dd>
        </div>
      </dl>

      {isEditing ? (
        <p className="stock-analysis-note-item__editing-status">
          현재 수정 중인 분석 노트입니다.
        </p>
      ) : null}

      <div className="stock-analysis-note-item__actions">
        <button
          type="button"
          className="stock-analysis-note-item__edit-button"
          disabled={isEditing}
          onClick={handleEditButtonClick}
        >
          {isEditing ? '수정 중' : '수정'}
        </button>
        <button
          type="button"
          className="stock-analysis-note-item__delete-button"
          onClick={handleDeleteButtonClick}
          aria-label={`${stockAnalysisNote.stockName} 분석 노트 삭제`}
        >
          삭제
        </button>
      </div>
    </article>
  );
}
