import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Pencil, X, ArrowUp, ArrowDown, ArrowUpDown, Paperclip, ChevronLeft, ChevronRight } from 'lucide-react';
import { Expense } from '../types';
import { EXPENSE_TYPES } from '../services/expenses';
import { EXPENSE_TYPE_DETAILS, quantityLine } from '../utils/expenseTypes';
import { formatPKR } from '../utils/formatters';
import { ReceiptViewer } from '../components/ReceiptViewer';

interface ExpenseGridProps {
  expenses: Expense[];
  onAddNew: () => void;
  onEdit: (expense: Expense) => void;
}

type SortKey = 'id' | 'description' | 'amount' | 'type' | 'date' | 'payee';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'id', label: '#' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date' },
  { key: 'payee', label: 'Paid to' },
];
const PAGE_SIZE = 25;

// Survives the trip to the edit screen and back, like the donations grid
const savedView = {
  query: '', type: 'all', dateFrom: '', dateTo: '',
  sortKey: 'date' as SortKey, sortDir: 'desc' as SortDir, page: 1, scrollY: null as number | null,
};

const selectClass =
  'px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';
const pageButton =
  'h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

export const ExpenseGrid: React.FC<ExpenseGridProps> = ({ expenses, onAddNew, onEdit }) => {
  const [query, setQuery] = useState(savedView.query);
  const [type, setType] = useState(savedView.type);
  const [dateFrom, setDateFrom] = useState(savedView.dateFrom);
  const [dateTo, setDateTo] = useState(savedView.dateTo);
  const [sortKey, setSortKey] = useState<SortKey>(savedView.sortKey);
  const [sortDir, setSortDir] = useState<SortDir>(savedView.sortDir);
  const [page, setPage] = useState(savedView.page);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const dir = sortDir === 'asc' ? 1 : -1;
    return expenses
      .filter(e =>
        (type === 'all' || e.type === type) &&
        (!dateFrom || e.date >= dateFrom) &&
        (!dateTo || e.date <= dateTo) &&
        (!q || e.id === q || [e.description, e.payee, e.notes, e.unit].some(v => (v || '').toLowerCase().includes(q)))
      )
      .sort((a, b) => {
        if (sortKey === 'amount') return (a.amount - b.amount) * dir;
        if (sortKey === 'id') return (Number(a.id) - Number(b.id)) * dir;
        return String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * dir;
      });
  }, [expenses, query, type, dateFrom, dateTo, sortKey, sortDir]);

  // Back to page 1 when the result set changes (not on mount, so a restored page survives)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setPage(1);
  }, [query, type, dateFrom, dateTo, sortKey, sortDir]);

  useEffect(() => {
    Object.assign(savedView, { query, type, dateFrom, dateTo, sortKey, sortDir, page });
  }, [query, type, dateFrom, dateTo, sortKey, sortDir, page]);

  useEffect(() => {
    if (savedView.scrollY === null) return;
    const y = savedView.scrollY;
    savedView.scrollY = null;
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, []);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const filteredTotal = rows.reduce((s, e) => s + e.amount, 0);
  const hasFilters = query !== '' || type !== 'all' || dateFrom !== '' || dateTo !== '';

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'amount' || key === 'date' || key === 'id' ? 'desc' : 'asc'); }
  };

  const edit = (e: Expense) => {
    savedView.scrollY = window.scrollY;
    onEdit(e);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Expenses</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{expenses.length} records • {formatPKR(total)} spent</p>
          </div>
          <button onClick={onAddNew} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> <span>Add Expense</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search #, description, paid to, notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <select value={type} onChange={e => setType(e.target.value)} className={selectClass} aria-label="Filter by type">
            <option value="all">All types</option>
            {EXPENSE_TYPES.map(t => <option key={t} value={t}>{EXPENSE_TYPE_DETAILS[t].emoji} {EXPENSE_TYPE_DETAILS[t].label}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} className={selectClass} aria-label="From date" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} className={selectClass} aria-label="To date" />
          </div>
          {hasFilters && (
            <button onClick={() => { setQuery(''); setType('all'); setDateFrom(''); setDateTo(''); }} className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong className="text-slate-800 dark:text-slate-200">{rows.length}</strong> of {expenses.length} •{' '}
          <strong className="text-rose-700 dark:text-rose-400">{formatPKR(filteredTotal)}</strong>
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
              <tr>
                {COLUMNS.map(col => {
                  const active = sortKey === col.key;
                  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return (
                    <th key={col.key} className={`px-3 py-2.5 font-semibold whitespace-nowrap border-b border-slate-200 dark:border-slate-800 ${col.align === 'right' ? 'text-right' : 'text-left'}`} aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button onClick={() => toggleSort(col.key)} className={`inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${active ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                        <span>{col.label}</span>
                        <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} />
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800"><span className="sr-only">Receipts and actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageRows.map(e => {
                const t = EXPENSE_TYPE_DETAILS[e.type];
                const detail = quantityLine(e.quantity, e.unit, e.rate);
                return (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-2 sm:px-3 py-2 font-mono text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{e.id}</td>
                    <td className="px-3 py-2 min-w-[140px]">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{e.description}</span>
                      {detail && <span className="block text-[11px] text-slate-500 dark:text-slate-400">{detail}</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap tabular-nums">{e.amount.toLocaleString('en-PK')}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${t.badge}`}>{t.emoji} {t.label}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{e.date}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 min-w-[110px]">{e.payee || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {e.receipts.length > 0 && (
                          <button onClick={() => setViewing(e)} className="inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer" title="View receipts">
                            <Paperclip className="w-3 h-3" /> {e.receipts.length}
                          </button>
                        )}
                        <button onClick={() => edit(e)} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-800/60 cursor-pointer">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-slate-500 dark:text-slate-400">
                    {expenses.length === 0 ? 'No expenses yet. Use "Add Expense" to record the first one.' : 'No expenses match these filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-3 px-3 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span>Page {currentPage} of {pageCount}</span>
            <div className="flex items-center gap-1">
              <button className={pageButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button className={pageButton} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      <ReceiptViewer
        receipts={viewing?.receipts ?? null}
        title={viewing ? `#${viewing.id} · ${viewing.description} · ${formatPKR(viewing.amount)}` : undefined}
        onClose={closeViewer}
      />
    </div>
  );
};

