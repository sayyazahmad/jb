import React, { useCallback, useMemo, useState } from 'react';
import { Paperclip, Calendar, Store } from 'lucide-react';
import { Expense } from '../types';
import { EXPENSE_TYPES } from '../services/expenses';
import { EXPENSE_TYPE_DETAILS, quantityLine } from '../utils/expenseTypes';
import { formatPKR, formatLakhs } from '../utils/formatters';
import { ReceiptViewer } from './ReceiptViewer';

interface ExpenseListProps {
  expenses: Expense[];
}

const PAGE = 30;

/** Public construction expense ledger: where the money went, plus every expense with its receipts */
export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses }) => {
  const [type, setType] = useState<string>('all');
  const [visible, setVisible] = useState(PAGE);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byType = useMemo(
    () =>
      EXPENSE_TYPES.map(t => ({ type: t, amount: expenses.filter(e => e.type === t).reduce((s, e) => s + e.amount, 0) }))
        .filter(x => x.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [expenses]
  );
  const shown = type === 'all' ? expenses : expenses.filter(e => e.type === type);

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No expenses recorded yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Every construction expense will be listed here with its receipts once work begins.
          <span className="font-urdu block mt-1">تعمیر شروع ہونے پر ہر خرچ رسید کے ساتھ یہاں درج ہوگا۔</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Where the money went */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Where the money went <span className="font-urdu text-xs text-slate-500 dark:text-slate-400">رقم کہاں خرچ ہوئی</span>
          </h2>
          <span className="text-sm font-extrabold text-rose-700 dark:text-rose-400 whitespace-nowrap">{formatPKR(total)}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800" aria-hidden="true">
          {byType.map(x => (
            <div key={x.type} className={EXPENSE_TYPE_DETAILS[x.type].bar} style={{ width: `${(x.amount / total) * 100}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setType('all'); setVisible(PAGE); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${type === 'all' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            All ({expenses.length})
          </button>
          {byType.map(x => {
            const d = EXPENSE_TYPE_DETAILS[x.type];
            return (
              <button
                key={x.type}
                onClick={() => { setType(x.type); setVisible(PAGE); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${type === x.type ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
              >
                <span className={`w-2 h-2 rounded-full ${d.bar}`} />
                <span>{d.label}</span>
                <span className="opacity-75">{Math.round((x.amount / total) * 100)}% · {formatLakhs(x.amount)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expense cards */}
      <div className="space-y-2.5">
        {shown.slice(0, visible).map(e => {
          const d = EXPENSE_TYPE_DETAILS[e.type];
          const detail = quantityLine(e.quantity, e.unit, e.rate);
          return (
            <div key={e.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg flex-shrink-0" title={d.label}>{d.emoji}</div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 break-words">{e.description}</h4>
                    {detail && <p className="text-xs text-slate-600 dark:text-slate-400">{detail}</p>}
                    <div className="flex items-center gap-x-2 gap-y-1 mt-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                      <span className={`px-1.5 py-0.5 rounded-md border font-semibold ${d.badge}`}>{d.label}</span>
                      <span className="inline-flex items-center gap-0.5"><Calendar className="w-3 h-3" />{e.date}</span>
                      {e.payee && <span className="inline-flex items-center gap-0.5"><Store className="w-3 h-3" />{e.payee}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-lg font-extrabold text-rose-700 dark:text-rose-400">{formatPKR(e.amount)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">#{e.id}</div>
                </div>
              </div>
              {(e.notes || e.receipts.length > 0) && (
                <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                  {e.notes ? <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{e.notes}"</p> : <span />}
                  {e.receipts.length > 0 && (
                    <button
                      onClick={() => setViewing(e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{e.receipts.length === 1 ? 'Receipt' : `${e.receipts.length} receipts`} / رسید</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {shown.length > visible && (
        <button
          onClick={() => setVisible(v => v + PAGE)}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          Show more ({shown.length - visible} left)
        </button>
      )}

      <ReceiptViewer
        receipts={viewing?.receipts ?? null}
        title={viewing ? `${viewing.description} · ${formatPKR(viewing.amount)} · ${viewing.date}` : undefined}
        onClose={closeViewer}
      />
    </div>
  );
};
