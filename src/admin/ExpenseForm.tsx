import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Save, Trash2, RefreshCw, AlertCircle, AlertTriangle, ImagePlus, X, Calendar, Calculator } from 'lucide-react';
import { Expense, ExpenseType } from '../types';
import { EXPENSE_TYPES, uploadReceipt, removeReceipts, receiptUrl } from '../services/expenses';
import { EXPENSE_TYPE_DETAILS } from '../utils/expenseTypes';
import { compressImage } from '../utils/images';
import { formatPKR } from '../utils/formatters';
import { ExpenseInput } from '../hooks/useExpenses';

interface ExpenseFormProps {
  /** Expense being edited, or null to add a new one */
  editingExpense: Expense | null;
  onSave: (input: ExpenseInput) => Promise<Expense>;
  onDelete: (expense: Expense) => Promise<void>;
  /** Called when finished (saved, deleted or cancelled) */
  onDone: () => void;
}

const DESCRIPTION_SUGGESTIONS: Record<ExpenseType, string[]> = {
  Material: ['Cement', 'Crush / Bajri', 'Sand / Ret', 'Steel / Sarya', 'Bricks', 'Bitumen'],
  Labour: ['Labour', 'Mason / Mistri', 'Excavation labour'],
  Machinery: ['Excavator', 'Roller', 'Tractor', 'Mixer'],
  Transport: ['Trolley', 'Truck', 'Dumper'],
  Other: ['Tools', 'Tea / Food for labour', 'Fuel'],
};
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'EasyPaisa', 'JazzCash'];
const MAX_PHOTOS = 8;

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';
const labelClass = 'text-xs font-bold text-slate-700 dark:text-slate-300';
const chipClass = (active: boolean) =>
  `px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
    active
      ? 'bg-emerald-700 border-emerald-700 text-white'
      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
  }`;

const today = () => new Date().toISOString().split('T')[0];
const parseNum = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(/,/g, '')));

interface NewPhoto { file: File; preview: string }

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ editingExpense, onSave, onDelete, onDone }) => {
  const [type, setType] = useState<ExpenseType>('Material');
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(EXPENSE_TYPE_DETAILS.Material.defaultUnit);
  const [rate, setRate] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [keptReceipts, setKeptReceipts] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingExpense) return;
    const e = editingExpense;
    setType(e.type);
    setDate(e.date);
    setDescription(e.description);
    setQuantity(e.quantity != null ? String(e.quantity) : '');
    setUnit(e.unit || '');
    setRate(e.rate != null ? String(e.rate) : '');
    setManualAmount(String(e.amount));
    setPayee(e.payee || '');
    setPaymentMethod(e.paymentMethod || '');
    setNotes(e.notes || '');
    setKeptReceipts(e.receipts);
  }, [editingExpense]);

  // Free preview object URLs when the form closes (individual removals free their own)
  const previewsRef = useRef<NewPhoto[]>([]);
  previewsRef.current = newPhotos;
  useEffect(() => () => previewsRef.current.forEach(p => URL.revokeObjectURL(p.preview)), []);

  const q = parseNum(quantity);
  const r = parseNum(rate);
  const autoAmount = q != null && r != null && !isNaN(q) && !isNaN(r) ? Math.round(q * r) : null;
  const amount = autoAmount ?? parseNum(manualAmount);

  const changeType = (t: ExpenseType) => {
    // Swap the unit only if it's still the previous type's default
    if (unit === EXPENSE_TYPE_DETAILS[type].defaultUnit) setUnit(EXPENSE_TYPE_DETAILS[t].defaultUnit);
    setType(t);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - keptReceipts.length - newPhotos.length;
    const picked = [...files].filter(f => f.type.startsWith('image/')).slice(0, Math.max(room, 0));
    setNewPhotos(prev => [...prev, ...picked.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    if (fileInput.current) fileInput.current.value = '';
  };

  const photoCount = keptReceipts.length + newPhotos.length;
  const removedReceipts = useMemo(
    () => (editingExpense ? editingExpense.receipts.filter(p => !keptReceipts.includes(p)) : []),
    [editingExpense, keptReceipts]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) return setError('Please enter what the expense was for.');
    if (amount == null || isNaN(amount) || amount <= 0) return setError('Please enter a valid amount (or quantity and rate).');
    if (!date) return setError('Please select a date.');

    setSaving(true);
    const uploaded: string[] = [];
    try {
      for (const photo of newPhotos) {
        uploaded.push(await uploadReceipt(await compressImage(photo.file), date));
      }
      await onSave({
        id: editingExpense?.id,
        date,
        type,
        description: description.trim(),
        quantity: q,
        unit: q != null ? unit.trim() || undefined : undefined,
        rate: r,
        amount: Math.round(amount),
        payee: payee.trim() || undefined,
        paymentMethod: paymentMethod || undefined,
        notes: notes.trim() || undefined,
        receipts: [...keptReceipts, ...uploaded],
      });
      // Only delete photos the admin removed once the record no longer points at them
      await removeReceipts(removedReceipts).catch(() => {});
      onDone();
    } catch (err: any) {
      await removeReceipts(uploaded).catch(() => {}); // don't leave orphaned uploads behind
      setError(err?.message || 'Could not save the expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingExpense) return;
    setDeleting(true);
    try {
      await onDelete(editingExpense);
      onDone();
    } catch (err: any) {
      setError(err?.message || 'Could not delete the expense.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <button type="button" onClick={onDone} className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Back to expenses">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingExpense ? `Edit Expense #${editingExpense.id}` : 'Add Expense'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-urdu">{editingExpense ? 'خرچ میں ترمیم' : 'نیا خرچ درج کریں'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Type */}
        <div className="space-y-2">
          <span className={labelClass}>Type *</span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {EXPENSE_TYPES.map(t => {
              const d = EXPENSE_TYPE_DETAILS[t];
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => changeType(t)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{d.emoji}</span>
                  <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{d.label}</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-urdu">{d.labelUrdu}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description & date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelClass} htmlFor="exp-description">What was it for? *</label>
            <input id="exp-description" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Cement, Excavator, Labour" className={inputClass} />
            <div className="flex gap-1 flex-wrap">
              {DESCRIPTION_SUGGESTIONS[type].map(s => (
                <button key={s} type="button" onClick={() => setDescription(s)} className={chipClass(description === s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={`${labelClass} flex items-center gap-1`} htmlFor="exp-date"><Calendar className="w-3.5 h-3.5" /> Date *</label>
            <input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Quantity × rate = amount */}
        <div className="bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 to-teal-50 dark:to-teal-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className={labelClass} htmlFor="exp-qty">Quantity</label>
              <input id="exp-qty" type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="200" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="exp-unit">Unit</label>
              <input id="exp-unit" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="bags" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass} htmlFor="exp-rate">Rate (Rs)</label>
              <input id="exp-rate" type="number" inputMode="decimal" min="0" step="any" value={rate} onChange={e => setRate(e.target.value)} placeholder="1450" className={inputClass} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={`${labelClass} flex items-center gap-1`} htmlFor="exp-amount">
              <span>Amount (Rs) *</span>
              {autoAmount != null && <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-semibold"><Calculator className="w-3 h-3" /> quantity × rate</span>}
            </label>
            <input
              id="exp-amount"
              type="number"
              inputMode="numeric"
              min="1"
              value={autoAmount != null ? String(autoAmount) : manualAmount}
              onChange={e => setManualAmount(e.target.value)}
              readOnly={autoAmount != null}
              placeholder="e.g. 290000"
              className={`${inputClass} text-lg font-black ${autoAmount != null ? 'opacity-80' : ''}`}
            />
            {amount != null && !isNaN(amount) && amount > 0 && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatPKR(Math.round(amount))}</p>}
          </div>
        </div>

        {/* Payee & payment method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="exp-payee">Paid to (vendor / worker)</label>
            <input id="exp-payee" type="text" value={payee} onChange={e => setPayee(e.target.value)} placeholder="e.g. Usman Traders" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>Payment method</span>
            <div className="flex gap-1.5 flex-wrap">
              {PAYMENT_METHODS.map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={chipClass(paymentMethod === m)}>{m}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="exp-notes">Notes (optional)</label>
          <input id="exp-notes" type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. delivered at Km 1.2" className={inputClass} />
        </div>

        {/* Receipt photos */}
        <div className="space-y-2">
          <span className={labelClass}>Receipt photos ({photoCount}/{MAX_PHOTOS})</span>
          <div className="flex gap-2 flex-wrap">
            {keptReceipts.map(path => (
              <div key={path} className="relative w-20 h-20">
                <img src={receiptUrl(path)} alt="Receipt" className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                <button type="button" onClick={() => setKeptReceipts(prev => prev.filter(p => p !== path))} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-rose-600 text-white cursor-pointer" aria-label="Remove photo">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {newPhotos.map(photo => (
              <div key={photo.preview} className="relative w-20 h-20">
                <img src={photo.preview} alt="New receipt" className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-400" />
                <button type="button" onClick={() => { URL.revokeObjectURL(photo.preview); setNewPhotos(prev => prev.filter(p => p !== photo)); }} className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-rose-600 text-white cursor-pointer" aria-label="Remove photo">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {photoCount < MAX_PHOTOS && (
              <button type="button" onClick={() => fileInput.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer">
                <ImagePlus className="w-5 h-5" />
                <span>Add</span>
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={e => addPhotos(e.target.files)} />
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Pick photos saved from WhatsApp. They're shrunk before upload and shown publicly with this expense.</p>
        </div>

        {error && (
          <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
          {editingExpense ? (
            <button type="button" disabled={saving || deleting} onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm cursor-pointer">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          ) : <div />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onDone} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 text-white font-extrabold text-sm shadow-md cursor-pointer">
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{saving ? (newPhotos.length ? 'Uploading photos…' : 'Saving…') : 'Save'}</span>
            </button>
          </div>
        </div>
      </form>

      {confirmDelete && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete expense #{editingExpense.id}?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{editingExpense.description} · {formatPKR(editingExpense.amount)} · its receipt photos are deleted too.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
              <button type="button" disabled={deleting} onClick={handleDelete} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
