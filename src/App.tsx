/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Trophy, ListOrdered, ReceiptText } from 'lucide-react';
import { DonationPhase, RoadMilestone } from './types';
import { CURRENT_PHASE, INITIAL_MILESTONES, getPhase } from './data/initialData';
import { PhaseTabs } from './components/PhaseTabs';
import { Header } from './components/Header';
import { CampaignStats } from './components/CampaignStats';
import { DonationList } from './components/DonationList';
import { VillageLeaderboard } from './components/VillageLeaderboard';
import { formatPKR } from './utils/formatters';
import { useDonations } from './hooks/useDonations';
import { useExpenses } from './hooks/useExpenses';
import { ExpenseList } from './components/ExpenseList';
import { ThankYouModal } from './components/ThankYouModal';
import { Footer } from './components/Footer';

// The admin area is a separate app at /admin. Keep old secret links (?admin, ?mode=admin, #admin) working.
const isLegacyAdminUrl = () => {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.has('admin') || searchParams.get('mode') === 'admin' || window.location.hash.toLowerCase().includes('admin');
  } catch {
    return false;
  }
};

if (isLegacyAdminUrl()) {
  window.location.replace('/admin/');
}

export default function App() {
  const { donations } = useDonations();
  const { expenses } = useExpenses();
  const [milestones] = useState<RoadMilestone[]>(INITIAL_MILESTONES);

  // Active view tab for public navigation
  // 'ledger' = Main donation list (highest on top)
  // 'villages' = Village rankings
  const [activeTab, setActiveTab] = useState<'ledger' | 'expenses' | 'villages'>('ledger');

  // Phase tabs: everything below them (stats, ledger, villages) shows the selected phase only
  const [phase, setPhase] = useState<DonationPhase>(CURRENT_PHASE);
  const phaseDonations = useMemo(() => donations.filter(d => d.phase === phase), [donations, phase]);

  const totalRaised = phaseDonations.reduce((sum, d) => sum + d.amount, 0);
  const grandTotal = useMemo(() => donations.reduce((sum, d) => sum + d.amount, 0), [donations]);

  // Thank-you popup opens on every page load
  const [showThanks, setShowThanks] = useState(true);
  const closeThanks = React.useCallback(() => setShowThanks(false), []);

  // Public view: donors who asked to hide their name are shown as "Anonymous" (admins see real names in /admin),
  // and the admin-only reference person is dropped. Doing it here covers the list, search, receipts,
  // WhatsApp text and CSV export in one place.
  const visibleDonations = useMemo(
    () => phaseDonations.map(({ referredBy: _adminOnly, ...d }) => (d.isAnonymous ? { ...d, donorName: 'Anonymous' } : d)),
    [phaseDonations]
  );

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 pb-20 sm:pb-12">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Road completed: reopen the thank-you message */}
        <button
          onClick={() => setShowThanks(true)}
          dir="rtl"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white px-4 py-2 shadow-sm transition-colors"
        >
          <span className="text-amber-300">✦</span>
          <span className="font-urdu text-sm sm:text-base leading-[2.2]">الحمدللہ! سڑک مکمل ہو گئی — تمام عطیہ دہندگان کا شکریہ</span>
          <span className="text-amber-300">✦</span>
        </button>

        <PhaseTabs donations={donations} phase={phase} onChange={setPhase} />

        {/* Campaign Hero & Stats */}
        <CampaignStats
          donations={phaseDonations}
          allDonations={donations}
          phase={phase}
          expenses={expenses}
          milestones={milestones}
        />

        {/* View Mode Navigation Tabs (Public: Ledger & Villages only) */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ledger'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Donations List ({phaseDonations.length})</span>
            <span className="hidden xs:inline font-urdu text-xs opacity-90">عطیات</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'expenses'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Expenses</span>
            <span className="hidden xs:inline font-urdu text-xs opacity-90">اخراجات</span>
          </button>

          <button
            onClick={() => setActiveTab('villages')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'villages'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Villages Rank</span>
            <span className="hidden xs:inline font-urdu text-xs opacity-90">گاؤں وار</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'ledger' && (
          <DonationList
            donations={visibleDonations}
          />
        )}

        {activeTab === 'expenses' && <ExpenseList expenses={expenses} />}

        {activeTab === 'villages' && (
          <VillageLeaderboard
            donations={visibleDonations}
            onSelectVillage={() => setActiveTab('ledger')}
          />
        )}
      </main>

      {/* On phones the credit sits in the sticky bottom bar instead */}
      <Footer className="hidden sm:block" />

      <ThankYouModal
        open={showThanks}
        onClose={closeThanks}
        donorCount={donations.length}
        totalRaised={grandTotal}
      />

      {/* Mobile Quick Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-4 sm:hidden flex items-center justify-between no-print shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">{getPhase(phase).label} Collected</div>
            <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 leading-tight">{formatPKR(totalRaised)}</div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right leading-tight">
          Developed by:<br />Sayyaz Ahmad
        </div>
      </div>
    </div>
  );
}
