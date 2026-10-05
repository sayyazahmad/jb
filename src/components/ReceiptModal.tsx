import React from 'react';
import { X, Printer, Share2, CheckCircle2, MapPin, Calendar, Wallet, FileText } from 'lucide-react';
import { Donation } from '../types';
import { formatPKR, formatLakhs, getSourceDetails, generateWhatsAppReceiptText } from '../utils/formatters';

interface ReceiptModalProps {
  donation: Donation | null;
  onClose: () => void;
  projectName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  donation,
  onClose,
  projectName = 'AWAMI ROAD (Jeeva Morh to Butti)'
}) => {
  if (!donation) return null;

  const sourceInfo = getSourceDetails(donation.source);

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppReceiptText(donation, 'Awami Road Campaign');
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop dismiss */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Slip Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-800/30 my-8 z-10">
        {/* Top Header Controls (Hidden on print) */}
        <div className="no-print bg-emerald-900 text-white px-5 py-3 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Official Donation Receipt</span>
            <span className="font-urdu text-xs text-amber-300">رسید عطیہ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper Body */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-amber-50/20 dark:from-amber-950/40 via-white dark:via-slate-900 to-amber-50/20 dark:to-amber-950/40 relative">
          {/* Certificate Border */}
          <div className="border-2 border-dashed border-emerald-600/40 rounded-2xl p-5 sm:p-6 relative bg-white dark:bg-slate-900 shadow-xs">
            {/* Watermark stamp background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-8xl font-black rotate-[-25deg] text-emerald-950 dark:text-emerald-200 font-urdu">عوامی سڑک</span>
            </div>

            {/* Header Stamp */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800 relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-900 text-amber-300 text-xl font-bold shadow-sm mb-1">
                🛣️
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {projectName}
              </h2>
              <div className="font-urdu text-sm font-bold text-emerald-800 dark:text-emerald-300">
                عوامی سڑک پروجیکٹ: جیوا موڑ تا بٹی
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Village Community Infrastructure & Road Development Fund
              </p>
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold">
                Receipt #{donation.receiptNumber}
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs py-3 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Date: <strong className="text-slate-800 dark:text-slate-200">{donation.date}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Village: <strong className="text-slate-800 dark:text-slate-200">{donation.villageName}</strong></span>
              </div>
            </div>

            {/* Donor & Amount Highlight */}
            <div className="py-4 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Received with thanks from / منجانب
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 pt-0.5">
                  {donation.donorName}
                </div>
              </div>

              {/* Big Amount Box */}
              <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 via-teal-50 dark:via-teal-950/40 to-emerald-50 dark:to-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Donation Amount / رقم عطیہ
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">
                  {formatPKR(donation.amount)}
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  ({formatLakhs(donation.amount)})
                </div>
              </div>

              {/* Details table */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Payment Mode:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {sourceInfo.label}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Reference / TRX:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {donation.reference || 'Recorded in Village Register'}
                  </span>
                </div>

                {donation.verifiedBy && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Collected / Verified By:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{donation.verifiedBy}</span>
                  </div>
                )}

                {donation.notes && (
                  <div className="py-1">
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Note / Dua:</span>
                    <p className="italic text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      "{donation.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sign & Stamp Footer */}
            <div className="pt-4 mt-2 border-t-2 border-slate-200 dark:border-slate-800 flex items-end justify-between">
              <div className="space-y-1">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600/60 flex flex-col items-center justify-center p-1 text-center rotate-[-12deg]">
                  <span className="text-[8px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-tighter">Awami Road</span>
                  <span className="text-[10px]">⭐</span>
                  <span className="text-[7px] text-emerald-700 dark:text-emerald-400 font-urdu">تصدیق شدہ</span>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">Verified Offline Ledger</span>
              </div>

              <div className="text-right space-y-1">
                <div className="h-6 flex items-end justify-end">
                  <div className="w-28 border-b border-slate-400 dark:border-slate-600"></div>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Road Committee</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-urdu">کمیٹی عوامی سڑک</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (No Print) */}
        <div className="no-print bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Print Receipt / پرنٹ</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
