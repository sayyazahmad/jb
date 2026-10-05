/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Trophy, ListOrdered } from 'lucide-react';
import { Donation, RoadMilestone } from './types';
import { INITIAL_MILESTONES } from './data/initialData';
import { Header } from './components/Header';
import { CampaignStats } from './components/CampaignStats';
import { DonationList } from './components/DonationList';
import { ReceiptModal } from './components/ReceiptModal';
import { VillageLeaderboard } from './components/VillageLeaderboard';
import { formatPKR } from './utils/formatters';
import { useDonations, useSettings } from './hooks/useDonations';

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
  const { settings } = useSettings();
  const [milestones] = useState<RoadMilestone[]>(INITIAL_MILESTONES);

  // Modals state
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState<Donation | null>(null);

  // Active view tab for public navigation
  // 'ledger' = Main donation list (highest on top)
  // 'villages' = Village rankings
  const [activeTab, setActiveTab] = useState<'ledger' | 'villages'>('ledger');

  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);

  // Public view: donors who asked to hide their name are shown as "Anonymous" (admins see real names in /admin),
  // and the admin-only reference person is dropped. Doing it here covers the list, search, receipts,
  // WhatsApp text and CSV export in one place.
  const visibleDonations = useMemo(
    () => donations.map(({ referredBy: _adminOnly, ...d }) => (d.isAnonymous ? { ...d, donorName: 'Anonymous' } : d)),
    [donations]
  );

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 pb-20 sm:pb-12">
      {/* Top Header */}
      <Header />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Campaign Hero & Stats */}
        <CampaignStats
          donations={donations}
          settings={settings}
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
            <span>Donations List ({donations.length})</span>
            <span className="hidden xs:inline font-urdu text-xs opacity-90">عطیات</span>
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
            onSelectDonation={(donation) => setSelectedDonationForReceipt(donation)}
          />
        )}

        {activeTab === 'villages' && (
          <VillageLeaderboard
            donations={visibleDonations}
            onSelectVillage={() => setActiveTab('ledger')}
          />
        )}
      </main>

      {/* Mobile Quick Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-4 sm:hidden flex items-center justify-between no-print shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">Total Collected</div>
            <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 leading-tight">{formatPKR(totalRaised)}</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReceiptModal
        donation={selectedDonationForReceipt}
        onClose={() => setSelectedDonationForReceipt(null)}
        projectName={`${settings.projectName} (${settings.routeDescription})`}
      />
    </div>
  );
}
