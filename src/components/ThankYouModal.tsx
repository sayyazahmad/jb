import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { formatPKR } from '../utils/formatters';

// Opening ceremony: Sunday 29 Nov 2026. The invitation line hides itself once the day has passed.
const CEREMONY_END = new Date('2026-11-30T00:00:00+05:00');

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
  donorCount: number;
  totalRaised: number;
}

export const ThankYouModal: React.FC<ThankYouModalProps> = ({ open, onClose, donorCount, totalRaised }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const showInvitation = new Date() < CEREMONY_END;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm thanks-fade"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="thanks-title"
    >
      {/* Never taller than the screen: the body scrolls inside if a very short phone needs it,
          and the close button stays visible at the bottom. */}
      <div
        className="relative w-full max-w-md max-h-[calc(100dvh-1.5rem)] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-amber-300/60 thanks-pop"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 px-5 pt-4 pb-2 text-center overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="absolute -bottom-12 -right-8 w-44 h-44 rounded-full bg-teal-300/20 blur-2xl" />
          <span className="absolute top-5 left-7 text-amber-200/80 thanks-twinkle">✦</span>
          <span className="absolute top-12 right-12 text-amber-200/70 text-sm thanks-twinkle [animation-delay:0.7s]">✦</span>

          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <img
            src="/icons/logo-256.png"
            alt="PAKS Unity Road logo"
            width={96}
            height={96}
            className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl thanks-heart"
          />

          <h2 id="thanks-title" dir="rtl" className="relative font-urdu text-2xl sm:text-3xl font-bold text-white mt-1 leading-[1.9]">
            دل کی گہرائیوں سے شکریہ
          </h2>
          <p dir="rtl" className="relative font-urdu text-amber-200 text-sm sm:text-base leading-[2]">
            الحمدللہ! پاکس یونٹی روڈ (جیوا موڑ تا بٹی) مکمل ہو گئی
          </p>
        </div>

        {/* Gold divider */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200" />

        {/* Body */}
        <div className="min-h-0 overflow-y-auto px-5 sm:px-6 py-3 text-center">
          <div dir="rtl" className="font-urdu text-slate-700 dark:text-slate-200 text-sm sm:text-[15px] leading-[2.1] space-y-1 text-justify">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-center">معزز عطیہ دہندگان!</p>
            <p>
              اللہ تعالیٰ کے فضل و کرم اور آپ سب کے بے لوث تعاون سے ہمارا دیرینہ خواب آج حقیقت بن چکا ہے۔
              آپ کا عطیہ بڑا تھا یا چھوٹا، نقد تھا یا سامان کی صورت میں — ہر ایک حصہ اس سڑک کی بنیاد ہے۔
              اللہ تعالیٰ آپ کو اس کارِ خیر کا بہترین اجر عطا فرمائے اور آپ کے رزق میں برکت دے۔ آمین۔
            </p>
          </div>

          {donorCount > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 py-1.5">
                <div className="text-lg font-black text-emerald-800 dark:text-emerald-300 leading-tight">{donorCount.toLocaleString('en-PK')}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Donations · <span className="font-urdu">عطیات</span>
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 py-1.5">
                <div className="text-lg font-black text-amber-700 dark:text-amber-300 leading-tight">{formatPKR(totalRaised)}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Raised · <span className="font-urdu">کل رقم</span>
                </div>
              </div>
            </div>
          )}

          {showInvitation && (
            <div dir="rtl" className="mt-3 rounded-xl bg-gradient-to-l from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/30 border border-amber-300 dark:border-amber-700 px-3 py-1">
              <p className="font-urdu font-bold text-sm text-amber-900 dark:text-amber-200 leading-[2]">
                🎉 افتتاحی تقریب: بروز اتوار، 29 نومبر 2026
              </p>
              <p className="font-urdu text-xs text-amber-800 dark:text-amber-300 leading-[2]">
                آپ سب کو شرکت کی پُرخلوص دعوت ہے
              </p>
            </div>
          )}

          <p dir="rtl" className="mt-2 font-urdu leading-[2.1]">
            <span className="text-xs text-slate-500 dark:text-slate-400">تہِ دل سے مشکور: </span>
            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">اہلیانِ خوشی کوٹ</span>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">With heartfelt gratitude — the people of Khushi Kot</p>
        </div>

        <div className="flex-shrink-0 px-5 sm:px-6 pb-4 pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md transition-colors"
          >
            <span className="font-urdu">جزاک اللہ</span> · Close
          </button>
        </div>
      </div>
    </div>
  );
};
