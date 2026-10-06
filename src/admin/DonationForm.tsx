import React, { useState, useEffect } from 'react';
import {
  Save, Trash2, Check, AlertCircle, Wallet,
  MapPin, Calendar, User, FileText, CheckCircle2,
  RefreshCw, AlertTriangle, ArrowLeft, UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Donation, PaymentSource } from '../types';
import { formatPKR } from '../utils/formatters';
import { DonationInput } from '../hooks/useDonations';

interface DonationFormProps {
  /** Record being edited, or null to add a new donation */
  editingDonation: Donation | null;
  onSaveDonation: (donation: DonationInput) => Promise<void> | void;
  onDeleteDonation: (id: string) => Promise<void> | void;
  /** Called when editing is finished (saved, deleted or cancelled) */
  onDone: () => void;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  editingDonation,
  onSaveDonation,
  onDeleteDonation,
  onDone
}) => {
  // Form State
  const [donorName, setDonorName] = useState('');
  const [villageName, setVillageName] = useState('Khushi Kot');
  const [source, setSource] = useState<PaymentSource>('Easypesa');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('Tanveer Wilayat');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [referredBy, setReferredBy] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  const handleConfirmDeleteEditing = async () => {
    if (!editingDonation) return;
    setIsDeletingRecord(true);
    try {
      await onDeleteDonation(editingDonation.id);
      setShowDeleteConfirm(false);
      setSuccessToast('Record deleted from Database successfully!');
      setTimeout(() => setSuccessToast(''), 4000);
      onDone();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete record from database.');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Common village presets as requested
  const villagePresets = ['Khushi Kot', 'Surjal', 'Palak', 'Kotli / Qablia', 'Danna Misrial', 'Arwar'];
  const committeePresets = ['Tanveer Wilayat', 'Faisal Abbasi', 'Talib Abbasi'];

  // Fill form if editing
  useEffect(() => {
    if (editingDonation) {
      setDonorName(editingDonation.donorName);
      setVillageName(editingDonation.villageName);
      setSource(editingDonation.source);
      setReference(editingDonation.reference || '');
      setDate(editingDonation.date);
      setAmount(editingDonation.amount.toString());
      setNotes(editingDonation.notes || '');
      setVerifiedBy(editingDonation.verifiedBy || '');
      setIsAnonymous(!!editingDonation.isAnonymous);
      setReferredBy(editingDonation.referredBy || '');
    }
  }, [editingDonation]);

  const handleAddQuickAmount = (val: number) => {
    const current = parseInt(amount, 10) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Validation: Donor Name
    if (!donorName.trim()) {
      setErrorMsg('Please enter Donor Name (نام)');
      return;
    }

    if (donorName.trim().length < 2) {
      setErrorMsg('Donor Name must be at least 2 characters');
      return;
    }

    // 2. Validation: Village Name
    if (!villageName.trim()) {
      setErrorMsg('Please enter or select Village Name (گاؤں)');
      return;
    }

    // 3. Validation: Amount
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid donation amount in RS (رقم)');
      return;
    }

    if (parsedAmount > 100000000) {
      setErrorMsg('Donation amount exceeds maximum allowed limit (Rs. 10 Crore)');
      return;
    }

    // 4. Validation: Date
    if (!date.trim()) {
      setErrorMsg('Please select a valid date (تاریخ)');
      return;
    }

    const savedDonation = {
      id: editingDonation ? editingDonation.id : undefined,
      donorName: donorName.trim(),
      villageName: villageName.trim(),
      source,
      reference: reference.trim(),
      date: date.trim(),
      amount: parsedAmount,
      notes: notes.trim(),
      verifiedBy: verifiedBy.trim(),
      referredBy: referredBy.trim(),
      isAnonymous
    };

    setIsSaving(true);
    try {
      // Save directly to Supabase DB & application state
      await onSaveDonation(savedDonation);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      setSuccessToast(
        editingDonation
          ? 'Record updated in Database successfully!'
          : 'Record saved in Database successfully!'
      );
      setTimeout(() => setSuccessToast(''), 4000);

      // Reset form on success
      if (!editingDonation) {
        setDonorName('');
        setAmount('');
        setReference('');
        setNotes('');
        setIsAnonymous(false);
        setReferredBy('');
      } else {
        onDone();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save record into database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Screen Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onDone}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to donations list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingDonation ? 'Edit Donation' : 'Add New Donation'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-urdu">
            {editingDonation ? 'عطیہ میں ترمیم' : 'نیا عطیہ درج کریں'}
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {successToast && (
        <div className="m-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 rounded-xl text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {editingDonation && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <span>Editing donation from <strong>{editingDonation.donorName}</strong></span>
              <button
                type="button"
                onClick={onDone}
                className="font-bold underline text-amber-950 dark:text-amber-200"
              >
                Cancel Edit
              </button>
            </div>
          )}

          {/* Amount Box (Prominent for fast phone entry) */}
          <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 to-teal-50 dark:to-teal-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <span className="text-base">💰</span>
                <span>Donation Amount in RS (رقم عطیہ) *</span>
              </label>
              {amount && !isNaN(parseInt(amount)) && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  {formatPKR(parseInt(amount))}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-500 dark:text-slate-400 text-sm">
                RS.
              </span>
              <input
                type="number"
                min="10"
                step="10"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-700/60 rounded-xl text-lg sm:text-xl font-black text-emerald-950 dark:text-emerald-200 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Booster Amount Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mr-1">Quick Add:</span>
              {[1000, 5000, 10000, 25000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddQuickAmount(val)}
                  className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 transition-all shadow-2xs"
                >
                  +{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Donor Name & Village Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donor Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Donor Name (نام / شناخت) *</span>
              </label>
              <input
                type="text"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="e.g. Haji Ghulam Murtaza, Chaudhry Riaz..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              {/* Anonymous toggle: real name is kept for admins, public sees "Anonymous" */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-200">Show as Anonymous</strong>
                  <span className="font-urdu ml-1">(گمنام)</span>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    Public ledger shows "Anonymous"; admins still see the real name.
                  </span>
                </span>
              </label>
            </div>

            {/* Village Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Village Name (گاؤں کا نام) *</span>
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Open text or select preset</span>
              </div>
              <input
                type="text"
                required
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                placeholder="e.g. Khushi Kot, Surjal, Palak, Kotli, Danna Misrial..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              {/* Village Quick Selection Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pt-1 scrollbar-none">
                {villagePresets.map((vp) => (
                  <button
                    key={vp}
                    type="button"
                    onClick={() => setVillageName(vp)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                      villageName === vp
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {vp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Source Selection (6 Large Touch Buttons) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Source of Transaction (ذریعہ ادائیگی) *</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Cash */}
              <button
                type="button"
                onClick={() => setSource('Cash')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  source === 'Cash'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">💵</span>
                  {source === 'Cash' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div className="mt-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Cash</strong>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-urdu">نقد وصولی</span>
                </div>
              </button>

              {/* EasyPaisa */}
              <button
                type="button"
                onClick={() => setSource('Easypesa')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  source === 'Easypesa'
                    ? 'border-teal-600 bg-teal-50/80 dark:bg-teal-950/30 ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">📱</span>
                  {source === 'Easypesa' && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                </div>
                <div className="mt-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">EasyPaisa</strong>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-urdu">ایزی پیسہ</span>
                </div>
              </button>

              {/* JazzCash */}
              <button
                type="button"
                onClick={() => setSource('Jazzcash')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  source === 'Jazzcash'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/30 ring-2 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">⚡</span>
                  {source === 'Jazzcash' && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <div className="mt-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">JazzCash</strong>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-urdu">جاز کیش</span>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setSource('BankTransfer')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  source === 'BankTransfer'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">🏛️</span>
                  {source === 'BankTransfer' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <div className="mt-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Bank Transfer</strong>
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-urdu">بینک اکاؤنٹ</span>
                </div>
              </button>

              {/* Material */}
              <button
                type="button"
                onClick={() => setSource('Material')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  source === 'Material'
                    ? 'border-violet-600 bg-violet-50/80 dark:bg-violet-950/30 ring-2 ring-violet-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">🧱</span>
                  {source === 'Material' && <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                </div>
                <div className="mt-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Material</strong>
                  <span className="text-[11px] text-violet-700 dark:text-violet-400 font-urdu">سامان</span>
                </div>
              </button>

              {/* Remaining (pledged, not yet received) */}
              <button
                type="button"
                onClick={() => setSource('Remaining')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  source === 'Remaining'
                    ? 'border-rose-600 bg-rose-50/80 dark:bg-rose-950/30 ring-2 ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">⏳</span>
                  {source === 'Remaining' && <Check className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                </div>
                <div className="mt-2">
                  <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Remaining</strong>
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 font-urdu">بقایا</span>
                </div>
              </button>
            </div>
          </div>

          {/* Reference Person, Transaction ID & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Reference person (admin only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Reference (حوالہ)</span>
              </label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="Person the donation came through"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Admin only — not shown on the public site.</p>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Transaction ID / Note</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="TRX ID, Check #, or Book Slip"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Date (تاریخ) *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Verified By / Committee Collector & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Received / Verified By</label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="Collector name"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-1 overflow-x-auto pt-0.5 scrollbar-none">
                {committeePresets.map(cp => (
                  <button
                    key={cp}
                    type="button"
                    onClick={() => setVerifiedBy(cp)}
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[140px]"
                  >
                    {cp.split(' ')[0]} {cp.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Dua / Dedication (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Esaal-e-Sawab for Marhoom parents..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
            {editingDonation ? (
              <button
                type="button"
                disabled={isDeletingRecord || isSaving}
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Delete from DB</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              {editingDonation && (
                <button
                  type="button"
                  onClick={onDone}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 text-white font-extrabold text-sm sm:text-base shadow-md transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      {/* Delete Confirmation Modal for Editing Record */}
      {showDeleteConfirm && editingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => !isDeletingRecord && setShowDeleteConfirm(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Donation from DB?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action will remove the record permanently.</p>
              </div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Donor Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{editingDonation.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Amount:</span>
                <span className="font-extrabold text-rose-700 dark:text-rose-400 text-sm">
                  {formatPKR(editingDonation.amount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this donation from the <strong>Supabase Database</strong> and the live ledger?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={handleConfirmDeleteEditing}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {isDeletingRecord ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from DB...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete from DB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
