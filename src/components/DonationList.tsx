import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, Filter, Trophy, Award, MapPin, 
  Calendar, Receipt, Share2, Sparkles, Building2, Wallet, 
  CheckCircle, FileSpreadsheet, Printer, X, Trash2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Donation, PaymentSource } from '../types';
import { formatPKR, formatLakhs, getSourceDetails, exportDonationsToCSV } from '../utils/formatters';

interface DonationListProps {
  donations: Donation[];
  onSelectDonation: (donation: Donation) => void;
  isAdmin?: boolean;
  onEditDonation?: (donation: Donation) => void;
  onDeleteDonation?: (donationId: string) => Promise<void> | void;
}

type SortOption = 'highest' | 'lowest' | 'newest' | 'oldest' | 'alphabetical';

export const DonationList: React.FC<DonationListProps> = ({
  donations,
  onSelectDonation,
  isAdmin = false,
  onEditDonation,
  onDeleteDonation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('highest'); // Default required: highest on top

  // Delete modal state
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDelete = async () => {
    if (!donationToDelete || !onDeleteDonation) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDeleteDonation(donationToDelete.id);
      setDonationToDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete record from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract unique villages with priority order as requested
  const villages = useMemo(() => {
    const priority = ['Khushi Kot', 'Surjal', 'Palak', 'Kotli', 'Danna Misrial'];
    const set = new Set(donations.map(d => d.villageName.trim()).filter(Boolean));
    const ordered: string[] = [];
    priority.forEach(p => {
      const match = Array.from(set).find(v => v.toLowerCase() === p.toLowerCase());
      if (match) {
        ordered.push(match);
        set.delete(match);
      } else {
        ordered.push(p);
      }
    });
    const rest = Array.from(set).sort();
    return [...ordered, ...rest];
  }, [donations]);

  // Filtered & sorted donations
  const filteredDonations = useMemo(() => {
    let result = [...donations];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.donorName.toLowerCase().includes(q) ||
        d.villageName.toLowerCase().includes(q) ||
        (d.reference && d.reference.toLowerCase().includes(q)) ||
        d.receiptNumber.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q))
      );
    }

    // Village filter
    if (selectedVillage !== 'all') {
      result = result.filter(d => d.villageName.toLowerCase() === selectedVillage.toLowerCase());
    }

    // Source filter
    if (selectedSource !== 'all') {
      result = result.filter(d => d.source === selectedSource);
    }

    // Sort: Default is highest on top!
    result.sort((a, b) => {
      switch (sortBy) {
        case 'highest':
          return b.amount - a.amount;
        case 'lowest':
          return a.amount - b.amount;
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'alphabetical':
          return a.donorName.localeCompare(b.donorName);
        default:
          return b.amount - a.amount;
      }
    });

    return result;
  }, [donations, searchQuery, selectedVillage, selectedSource, sortBy]);

  // Find the absolute highest rank index for honors
  const sortedByAmount = useMemo(() => {
    return [...donations].sort((a, b) => b.amount - a.amount);
  }, [donations]);

  const getRankByAmount = (donationId: string) => {
    const index = sortedByAmount.findIndex(d => d.id === donationId);
    return index !== -1 ? index + 1 : null;
  };

  const totalFilteredAmount = useMemo(() => {
    return filteredDonations.reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDonations]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Public Donation Ledger</span>
            </h2>
            <span className="font-urdu text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              عوامی فہرست عطیات
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Sorted by highest contribution first for complete village transparency
          </p>
        </div>

        {/* Export & Print tools */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => exportDonationsToCSV(filteredDonations)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors active:scale-95"
            title="Download CSV for Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors active:scale-95"
            title="Print Donation Sheet"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden xs:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 no-print">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donor name, village (Butti, Jeeva Morh), receipt #..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort donations"
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="highest">💰 Highest Amount (سب سے زیادہ)</option>
              <option value="newest">📅 Newest Date (تازہ ترین)</option>
              <option value="lowest">📉 Lowest Amount</option>
              <option value="alphabetical">🔤 Donor Name (A-Z)</option>
            </select>
          </div>

          {/* Quick Filter Counts */}
          <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-end gap-2">
            <span>Showing <strong className="text-slate-800 font-bold">{filteredDonations.length}</strong> of {donations.length} donations</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {formatPKR(totalFilteredAmount)}
            </span>
          </div>
        </div>

        {/* Village Filter Chips */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Village:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedVillage('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedVillage === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Villages ({donations.length})
            </button>
            {villages.map((v) => {
              const count = donations.filter(d => d.villageName.toLowerCase() === v.toLowerCase()).length;
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVillage(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedVillage.toLowerCase() === v.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {v} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Source Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-thin">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Source:
          </span>
          <button
            onClick={() => setSelectedSource('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedSource === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sources
          </button>
          {(['Cash', 'BankTransfer', 'Easypesa', 'Jazzcash'] as PaymentSource[]).map((src) => {
            const count = donations.filter(d => d.source === src).length;
            const details = getSourceDetails(src);
            return (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedSource === src
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{details.label}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Donations List Container */}
      <div className="space-y-2.5">
        {filteredDonations.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No donations found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No records match your search or filter criteria. Try clearing search or selecting "All Villages".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedVillage('all');
                setSelectedSource('all');
              }}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredDonations.map((donation) => {
            const rank = getRankByAmount(donation.id);
            const sourceInfo = getSourceDetails(donation.source);
            const isTopThree = rank !== null && rank <= 3;

            return (
              <div
                key={donation.id}
                onClick={() => onSelectDonation(donation)}
                className={`group bg-white rounded-2xl p-4 sm:p-4.5 border transition-all cursor-pointer relative overflow-hidden active:scale-[0.99] hover:shadow-md ${
                  isTopThree
                    ? rank === 1
                      ? 'border-amber-300 ring-1 ring-amber-400/30 bg-gradient-to-r from-amber-50/40 via-white to-white'
                      : rank === 2
                      ? 'border-slate-300 ring-1 ring-slate-300/40 bg-gradient-to-r from-slate-50/50 via-white to-white'
                      : 'border-orange-200 ring-1 ring-orange-200/40 bg-gradient-to-r from-orange-50/30 via-white to-white'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                {/* Mobile Top Header: Rank, Badges & Amount */}
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Rank & Donor Identity */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Rank Medal Indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      {rank === 1 ? (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 flex flex-col items-center justify-center shadow-xs font-extrabold text-xs">
                          <span>🥇</span>
                          <span className="text-[9px] -mt-1 font-black">#1</span>
                        </div>
                      ) : rank === 2 ? (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 flex flex-col items-center justify-center shadow-xs font-extrabold text-xs">
                          <span>🥈</span>
                          <span className="text-[9px] -mt-1 font-black">#2</span>
                        </div>
                      ) : rank === 3 ? (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 text-white flex flex-col items-center justify-center shadow-xs font-extrabold text-xs">
                          <span>🥉</span>
                          <span className="text-[9px] -mt-1 font-black">#3</span>
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                          #{rank}
                        </div>
                      )}
                    </div>

                    {/* Donor Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {donation.donorName}
                        </h4>
                        {rank === 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Highest Contributor
                          </span>
                        )}
                      </div>

                      {/* Village and Receipt tags */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{donation.villageName}</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {donation.receiptNumber}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{donation.date}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Big Amount in PKR */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-base sm:text-xl font-extrabold text-emerald-700 tracking-tight">
                      {formatPKR(donation.amount)}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-emerald-600">
                      {formatLakhs(donation.amount)}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Source badge, Reference, Notes & Action */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {/* Payment Source Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] border ${sourceInfo.badgeBg} ${sourceInfo.badgeBorder}`}>
                      <Wallet className="w-3 h-3" />
                      <span>{sourceInfo.label}</span>
                    </span>

                    {/* Reference / TRX */}
                    {donation.reference && (
                      <span className="text-slate-500 text-[11px] truncate max-w-[200px]" title={donation.reference}>
                        Ref: <strong className="text-slate-700 font-medium">{donation.reference}</strong>
                      </span>
                    )}

                    {/* Received by */}
                    {donation.verifiedBy && (
                      <span className="text-[11px] text-slate-400 hidden xs:inline">
                        Recv by: <strong className="text-slate-600">{donation.verifiedBy}</strong>
                      </span>
                    )}
                  </div>

                  {/* View Receipt Button */}
                  <div className="flex items-center gap-1.5 ml-auto no-print">
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditDonation) onEditDonation(donation);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError('');
                            setDonationToDelete(donation);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          title="Delete from Database"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDonation(donation);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <Receipt className="w-3 h-3 text-emerald-600" />
                      <span>Receipt / رسید</span>
                    </button>
                  </div>
                </div>

                {/* Optional Note / Dedication */}
                {donation.notes && (
                  <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 italic">
                    "{donation.notes}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {donationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => !isDeleting && setDonationToDelete(null)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl z-10 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">Delete Donation from DB?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {/* Target record summary */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Donor Name:</span>
                <span className="font-bold text-slate-900">{donationToDelete.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Amount:</span>
                <span className="font-extrabold text-rose-700 text-sm">
                  {formatPKR(donationToDelete.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Village:</span>
                <span className="font-medium text-slate-800">{donationToDelete.villageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Receipt #:</span>
                <span className="font-mono text-slate-600">{donationToDelete.receiptNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this record from your <strong>Supabase Database</strong> and the community ledger?
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDonationToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                {isDeleting ? (
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
