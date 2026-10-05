import React, { useEffect, useState } from 'react';
import { ListOrdered, PlusCircle, Download, LogOut, ExternalLink, Plus, ArrowLeft } from 'lucide-react';
import { Donation } from '../types';
import { INITIAL_DONATIONS, INITIAL_SETTINGS } from '../data/initialData';
import { Header } from '../components/Header';
import { DonationList } from '../components/DonationList';
import { ReceiptModal } from '../components/ReceiptModal';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { useDonations, useSettings } from '../hooks/useDonations';
import { formatPKR } from '../utils/formatters';
import { DonationForm } from './DonationForm';
import { BackupPanel } from './BackupPanel';
import { AdminRoute, navigate, useAdminRoute } from './router';

const STORAGE_KEY_ADMIN_AUTH = 'awami_road_admin_auth_v2';

const NAV_ITEMS: { route: AdminRoute; label: string; icon: React.ElementType }[] = [
  { route: { name: 'list' }, label: 'Donations', icon: ListOrdered },
  { route: { name: 'new' }, label: 'Add New', icon: PlusCircle },
  { route: { name: 'backup' }, label: 'Backup', icon: Download },
];

export default function AdminApp() {
  const { donations, setDonations, saveDonation, deleteDonation, isLoaded } = useDonations();
  const { settings, setSettings } = useSettings();
  const route = useAdminRoute();
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState<Donation | null>(null);

  // Admin authentication state (client-side only, see AdminLoginModal)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, isAdmin ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [isAdmin]);

  const handleLogout = () => {
    setIsAdmin(false);
    navigate({ name: 'list' });
  };

  // Reset to demo data
  const handleResetData = () => {
    setDonations(INITIAL_DONATIONS);
    setSettings(INITIAL_SETTINGS);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950">
        <Header />
        <AdminLoginModal
          isOpen
          onClose={() => { window.location.href = '/'; }}
          expectedUsername={settings.adminUsername || 'admin'}
          expectedPassword={settings.adminPassword || 'Ochor1!'}
          onSuccess={() => setIsAdmin(true)}
        />
      </div>
    );
  }

  const isNavActive = (item: AdminRoute) =>
    item.name === route.name || (item.name === 'list' && route.name === 'edit');

  const editingDonation = route.name === 'edit' ? donations.find(d => d.id === route.id) || null : null;
  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 pb-12">
      <Header
        actions={
          <>
            <a
              href="/"
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-xl text-xs text-emerald-200 hover:text-white hover:bg-white/10 transition-colors items-center gap-1"
              title="Open public site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public site</span>
            </a>
            <button
              onClick={handleLogout}
              title="Log out"
              className="px-2.5 py-1.5 rounded-xl text-xs text-emerald-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        }
      >
        {/* Admin Navigation */}
        <nav className="flex items-center gap-1 mt-3 -mb-1 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mr-2 whitespace-nowrap">Admin</span>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isNavActive(item.route);
            return (
              <button
                key={item.route.name}
                onClick={() => navigate(item.route)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  active ? 'bg-white/15 text-white' : 'text-emerald-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </Header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {route.name === 'list' && (
          <>
            {/* List Screen Header with Add New */}
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">All Donations</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {donations.length} records • {formatPKR(totalRaised)}
                </p>
              </div>
              <button
                onClick={() => navigate({ name: 'new' })}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New</span>
              </button>
            </div>

            <DonationList
              donations={donations}
              isAdmin
              onSelectDonation={setSelectedDonationForReceipt}
              onEditDonation={(donation) => navigate({ name: 'edit', id: donation.id })}
              onDeleteDonation={deleteDonation}
            />
          </>
        )}

        {route.name === 'new' && (
          <DonationForm
            donations={donations}
            editingDonation={null}
            onSaveDonation={saveDonation}
            onDeleteDonation={deleteDonation}
            onDone={() => navigate({ name: 'list' })}
          />
        )}

        {route.name === 'edit' && !editingDonation && !isLoaded && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading donation…
          </div>
        )}

        {route.name === 'edit' && (editingDonation || isLoaded) && (
          editingDonation ? (
            <DonationForm
              key={editingDonation.id}
              donations={donations}
              editingDonation={editingDonation}
              onSaveDonation={saveDonation}
              onDeleteDonation={deleteDonation}
              onDone={() => navigate({ name: 'list' })}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">Donation not found. It may have been deleted.</p>
              <button
                onClick={() => navigate({ name: 'list' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to list</span>
              </button>
            </div>
          )
        )}

        {route.name === 'backup' && (
          <BackupPanel
            donations={donations}
            onImportData={setDonations}
            onResetData={handleResetData}
          />
        )}
      </main>

      <ReceiptModal
        donation={selectedDonationForReceipt}
        onClose={() => setSelectedDonationForReceipt(null)}
        projectName={`${settings.projectName} (${settings.routeDescription})`}
      />
    </div>
  );
}
