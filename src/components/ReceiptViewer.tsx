import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { receiptUrl } from '../services/expenses';

interface ReceiptViewerProps {
  /** Storage paths of the photos; null closes the viewer */
  receipts: string[] | null;
  title?: string;
  onClose: () => void;
}

/** Full-screen photo viewer for expense receipts (keyboard: ← → Esc) */
export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ receipts, title, onClose }) => {
  const [index, setIndex] = useState(0);
  const count = receipts?.length ?? 0;

  useEffect(() => setIndex(0), [receipts]);

  useEffect(() => {
    if (!count) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % count);
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [count, onClose]);

  if (!receipts || !count) return null;
  const url = receiptUrl(receipts[Math.min(index, count - 1)]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" role="dialog" aria-modal="true" aria-label="Receipt photos">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{title || 'Receipt'}</p>
          {count > 1 && <p className="text-xs text-white/60">Photo {index + 1} of {count}</p>}
        </div>
        <div className="flex items-center gap-1">
          <a href={url} target="_blank" rel="noreferrer" className="p-2 rounded-xl hover:bg-white/10" title="Open full size">
            <ExternalLink className="w-5 h-5" />
          </a>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 pb-4" onClick={onClose}>
        <img
          src={url}
          alt={`${title || 'Receipt'} — photo ${index + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        {count > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex(i => (i - 1 + count) % count); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % count); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
