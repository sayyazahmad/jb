import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Plus, Pencil, FileSpreadsheet, FileText, ArrowUp, ArrowDown, ArrowUpDown, EyeOff, X, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Donation, PaymentSource } from '../types';
import { formatPKR, getSourceDetails } from '../utils/formatters';
import { exportDonationsToExcel, exportDonationsToPDF } from './exports';

interface DonationGridProps {
  donations: Donation[];
  onAddNew: () => void;
  onEdit: (donation: Donation) => void;
}

type SortKey = 'id' | 'date' | 'donorName' | 'villageName' | 'referredBy' | 'source' | 'amount';
type SortDir = 'asc' | 'desc';

const SOURCES: PaymentSource[] = ['Cash', 'BankTransfer', 'Easypesa', 'Jazzcash', 'Material', 'Remaining'];

type Anonymity = 'all' | 'anonymous' | 'named';

// The grid unmounts while the edit screen is open. Keeping its view state at module level means
// returning from Edit (save, cancel or browser Back) lands on the same page, filters and scroll
// position. It resets on a full page reload.
const savedView = {
  query: '',
  village: 'all',
  source: 'all',
  anonymity: 'all' as Anonymity,
  sortKey: 'amount' as SortKey,
  sortDir: 'desc' as SortDir,
  page: 1,
  pageSize: 25,
  scrollY: null as number | null,
};

const COLUMNS: { key: SortKey; label: string; shortLabel?: string; align?: 'right' }[] = [
  { key: 'id', label: 'Receipt #', shortLabel: '#' },
  { key: 'donorName', label: 'Donor' },
  { key: 'villageName', label: 'Village' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'referredBy', label: 'Reference' },
  { key: 'source', label: 'Source' },
  { key: 'date', label: 'Date' },
];

const PAGE_SIZES = [25, 50, 100];

// Page numbers to show: first, last, and a window around the current page, with gaps as null ("…")
const pageNumbers = (current: number, count: number): (number | null)[] => {
  const pages = new Set([1, count, current - 1, current, current + 1]);
  const sorted = [...pages].filter(p => p >= 1 && p <= count).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
};

const pageButtonClass =
  'min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

const selectClass =
  'px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';

export const DonationGrid: React.FC<DonationGridProps> = ({ donations, onAddNew, onEdit }) => {
  const [query, setQuery] = useState(savedView.query);
  const [village, setVillage] = useState(savedView.village);
  const [source, setSource] = useState(savedView.source);
  const [anonymity, setAnonymity] = useState<Anonymity>(savedView.anonymity);
  const [sortKey, setSortKey] = useState<SortKey>(savedView.sortKey);
  const [sortDir, setSortDir] = useState<SortDir>(savedView.sortDir);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState('');
  const [page, setPage] = useState(savedView.page);
  const [pageSize, setPageSize] = useState(savedView.pageSize);
  const gridRef = useRef<HTMLDivElement>(null);

  const villages = useMemo(
    () => Array.from(new Set(donations.map(d => d.villageName.trim()))).sort((a, b) => a.localeCompare(b)),
    [donations]
  );

  const compare = (a: Donation, b: Donation) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'amount') return (a.amount - b.amount) * dir;
    return String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true, sensitivity: 'base' }) * dir;
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const filtered = donations.filter(d =>
      (village === 'all' || d.villageName.trim() === village) &&
      (source === 'all' || d.source === source) &&
      (anonymity === 'all' || (anonymity === 'anonymous') === !!d.isAnonymous) &&
      (!q ||
        d.id === q ||
        d.donorName.toLowerCase().includes(q) ||
        d.villageName.toLowerCase().includes(q) ||
        (d.reference || '').toLowerCase().includes(q) ||
        (d.referredBy || '').toLowerCase().includes(q) ||
        (d.notes || '').toLowerCase().includes(q))
    );

    return filtered.sort(compare);
  }, [donations, query, village, source, anonymity, sortKey, sortDir]);

  const filteredTotal = rows.reduce((sum, d) => sum + d.amount, 0);

  // Back to the first page whenever the result set or its order changes — but not on mount,
  // so a page restored from savedView survives coming back from the edit screen
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPage(1);
  }, [query, village, source, anonymity, sortKey, sortDir, pageSize]);

  // Remember the view for the next time the grid mounts
  useEffect(() => {
    Object.assign(savedView, { query, village, source, anonymity, sortKey, sortDir, page, pageSize });
  }, [query, village, source, anonymity, sortKey, sortDir, page, pageSize]);

  // Restore the scroll position saved when Edit was clicked (navigation scrolls to the top)
  useEffect(() => {
    if (savedView.scrollY === null) return;
    const y = savedView.scrollY;
    savedView.scrollY = null;
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, []);

  const handleEdit = (d: Donation) => {
    savedView.scrollY = window.scrollY;
    onEdit(d);
  };

  // Clamp in case rows shrink under the current page (e.g. a realtime delete)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(firstIndex, firstIndex + pageSize);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(p, 1), pageCount));
    // Bring the top of the grid back into view when paging from the bottom
    const top = gridRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const hasFilters = query !== '' || village !== 'all' || source !== 'all' || anonymity !== 'all';

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'amount' || key === 'date' ? 'desc' : 'asc');
    }
  };

  const clearFilters = () => {
    setQuery('');
    setVillage('all');
    setSource('all');
    setAnonymity('all');
  };

  const runExport = async (kind: 'excel' | 'pdf') => {
    setExportError('');
    setExporting(kind);
    try {
      // Exports always include every donation (filters ignored), in the grid's current sort order
      const all = [...donations].sort(compare);
      if (kind === 'excel') await exportDonationsToExcel(all);
      else await exportDonationsToPDF(all);
    } catch (err: any) {
      console.error('Export failed', err);
      setExportError(err?.message || 'Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">All Donations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {donations.length} records • {formatPKR(donations.reduce((sum, d) => sum + d.amount, 0))}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => runExport('excel')}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 disabled:opacity-60 transition-colors cursor-pointer"
              title="Download all donations as an Excel file"
            >
              {exporting === 'excel' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>Excel</span>
            </button>
            <button
              onClick={() => runExport('pdf')}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 disabled:opacity-60 transition-colors cursor-pointer"
              title="Download all donations as a PDF"
            >
              {exporting === 'pdf' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>PDF</span>
            </button>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>
        </div>

        {exportError && (
          <p className="text-xs text-rose-700 dark:text-rose-400">{exportError}</p>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search receipt #, name, village, reference, notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <select value={village} onChange={(e) => setVillage(e.target.value)} className={selectClass} aria-label="Filter by village">
            <option value="all">All villages</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass} aria-label="Filter by source">
            <option value="all">All sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{getSourceDetails(s).label.split(' (')[0]}</option>)}
          </select>
          <select value={anonymity} onChange={(e) => setAnonymity(e.target.value as Anonymity)} className={selectClass} aria-label="Filter by anonymity">
            <option value="all">Named & anonymous</option>
            <option value="named">Named only</option>
            <option value="anonymous">Anonymous only</option>
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong className="text-slate-800 dark:text-slate-200">{rows.length}</strong> of {donations.length} •{' '}
          <strong className="text-emerald-700 dark:text-emerald-400">{formatPKR(filteredTotal)}</strong>
        </p>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="scroll-mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
              <tr>
                {COLUMNS.map(col => {
                  const active = sortKey === col.key;
                  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return (
                    <th
                      key={col.key}
                      className={`px-3 py-2.5 font-semibold whitespace-nowrap border-b border-slate-200 dark:border-slate-800 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${active ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
                      >
                        {col.shortLabel ? (
                          <>
                            <span className="sm:hidden">{col.shortLabel}</span>
                            <span className="hidden sm:inline">{col.label}</span>
                          </>
                        ) : (
                          <span>{col.label}</span>
                        )}
                        <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} />
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageRows.map(d => {
                const src = getSourceDetails(d.source);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-2 sm:px-3 py-2 font-mono text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{d.id}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100 min-w-[160px]">
                      <span>{d.donorName}</span>
                      {d.isAnonymous && (
                        <span
                          className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                          title="Shown as Anonymous in the public view"
                        >
                          <EyeOff className="w-2.5 h-2.5" /> Anon
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap truncate max-w-20 sm:max-w-none" title={d.villageName}>{d.villageName}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap tabular-nums">{d.amount.toLocaleString('en-PK')}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 min-w-[120px]">{d.referredBy || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${src.badgeBg} ${src.badgeBorder}`}>
                        {src.label.split(' (')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{d.date}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-slate-500 dark:text-slate-400">
                    No donations match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap px-3 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                <strong className="text-slate-800 dark:text-slate-200">{firstIndex + 1}–{firstIndex + pageRows.length}</strong> of {rows.length}
              </span>
              <label className="inline-flex items-center gap-1.5">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>

            {pageCount > 1 && (
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`${pageButtonClass} border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700`}
                  aria-label="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`${pageButtonClass} border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pageNumbers(currentPage, pageCount).map((p, i) =>
                  p === null ? (
                    <span key={`gap-${i}`} className="px-1 text-slate-400 dark:text-slate-500">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      aria-current={p === currentPage ? 'page' : undefined}
                      className={`${pageButtonClass} ${
                        p === currentPage
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  className={`${pageButtonClass} border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700`}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => goToPage(pageCount)}
                  disabled={currentPage === pageCount}
                  className={`${pageButtonClass} border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700`}
                  aria-label="Last page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
