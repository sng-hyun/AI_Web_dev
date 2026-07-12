import type { StockAnalysisNote } from '../types/stockAnalysisNote';
import EmptyStockAnalysisNoteList from './EmptyStockAnalysisNoteList';
import StockAnalysisNoteItem from './StockAnalysisNoteItem';

interface StockAnalysisNoteListProps {
  stockAnalysisNotes: StockAnalysisNote[];
  editingStockAnalysisNoteId: string | null;
  onEditStockAnalysisNote: (stockAnalysisNoteId: string) => void;
  onDeleteStockAnalysisNote: (stockAnalysisNoteId: string) => void;
}

export default function StockAnalysisNoteList({
  stockAnalysisNotes,
  editingStockAnalysisNoteId,
  onEditStockAnalysisNote,
  onDeleteStockAnalysisNote,
}: StockAnalysisNoteListProps) {
  if (stockAnalysisNotes.length === 0) {
    return <EmptyStockAnalysisNoteList />;
  }

  return (
    <ul className="stock-analysis-note-list" aria-label="관심종목 분석 노트 목록">
      {stockAnalysisNotes.map((stockAnalysisNote) => (
        <li className="stock-analysis-note-list__item" key={stockAnalysisNote.id}>
          <StockAnalysisNoteItem
            stockAnalysisNote={stockAnalysisNote}
            isEditing={stockAnalysisNote.id === editingStockAnalysisNoteId}
            onEditStockAnalysisNote={onEditStockAnalysisNote}
            onDeleteStockAnalysisNote={onDeleteStockAnalysisNote}
          />
        </li>
      ))}
    </ul>
  );
}
