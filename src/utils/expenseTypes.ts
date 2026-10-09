import { ExpenseType } from '../types';

interface ExpenseTypeDetails {
  label: string;
  labelUrdu: string;
  emoji: string;
  /** Suggested unit for quantity × rate */
  defaultUnit: string;
  badge: string; // tailwind classes for the type chip
  bar: string; // tailwind bg class for the breakdown bar
}

export const EXPENSE_TYPE_DETAILS: Record<ExpenseType, ExpenseTypeDetails> = {
  Material: {
    label: 'Material', labelUrdu: 'سامان', emoji: '🧱', defaultUnit: 'bags',
    badge: 'bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
    bar: 'bg-violet-500',
  },
  Labour: {
    label: 'Labour', labelUrdu: 'مزدوری', emoji: '👷', defaultUnit: 'worker-days',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/60',
    bar: 'bg-amber-500',
  },
  Machinery: {
    label: 'Machinery', labelUrdu: 'مشینری', emoji: '🚜', defaultUnit: 'hours',
    badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    bar: 'bg-blue-500',
  },
  Transport: {
    label: 'Transport', labelUrdu: 'ٹرانسپورٹ', emoji: '🚚', defaultUnit: 'trips',
    badge: 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
    bar: 'bg-teal-500',
  },
  Other: {
    label: 'Other', labelUrdu: 'دیگر', emoji: '🧾', defaultUnit: '',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    bar: 'bg-slate-400',
  },
};

/** "200 bags × Rs 1,450" style detail line, or '' when no quantity/rate was recorded */
export const quantityLine = (quantity?: number, unit?: string, rate?: number) => {
  if (quantity == null) return '';
  const q = `${quantity.toLocaleString('en-PK')}${unit ? ` ${unit}` : ''}`;
  return rate != null ? `${q} × Rs ${rate.toLocaleString('en-PK')}` : q;
};
