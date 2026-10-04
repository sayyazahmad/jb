/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, MapPin, Plus, ShieldCheck, HeartHandshake, 
  HelpCircle, PhoneCall, ListOrdered, Building, Camera, 
  Share2, Sparkles, AlertCircle, ArrowUpCircle
} from 'lucide-react';
import { Donation, ProjectSettings, RoadMilestone, PaymentSource } from './types';
import { INITIAL_DONATIONS, INITIAL_SETTINGS, INITIAL_MILESTONES } from './data/initialData';
import { Header } from './components/Header';
import { CampaignStats } from './components/CampaignStats';
import { DonationList } from './components/DonationList';
import { AdminPanel } from './components/AdminPanel';
import { ReceiptModal } from './components/ReceiptModal';
import { VillageLeaderboard } from './components/VillageLeaderboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { formatPKR, formatLakhs } from './utils/formatters';
import {
  saveDonationToSupabase,
  deleteDonationFromSupabase,
  fetchDonationsFromSupabase,
  subscribeToDonationChanges,
  supabase
} from './services/supabase';

const STORAGE_KEY_DONATIONS = 'awami_road_donations_v3';
const STORAGE_KEY_SETTINGS = 'awami_road_settings_v3';
const STORAGE_KEY_ADMIN_AUTH = 'awami_road_admin_auth_v2';

export default function App() {
  // Load persistent state or initial seed (v3 has expanded 200 records)
  const [donations, setDonations] = useState<Donation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DONATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_DONATIONS.length) return parsed;
      }
    } catch (e) {
      console.error('Failed to load local storage donations', e);
    }
    return INITIAL_DONATIONS;
  });

  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_SETTINGS;
  });

  const [milestones] = useState<RoadMilestone[]>(INITIAL_MILESTONES);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
    } catch {
      return false;
    }
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Modals state
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState<Donation | null>(null);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);

  // Active view tab for public navigation
  // 'ledger' = Main donation list (highest on top)
  // 'villages' = Village rankings
  const [activeTab, setActiveTab] = useState<'ledger' | 'villages'>('ledger');

  // Check if URL contains secret admin parameter or hash (?admin, ?admin=true, #admin)
  const checkIsAdminUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hasAdminQuery = searchParams.has('admin') || searchParams.get('mode') === 'admin';
      const hasAdminHash = window.location.hash.toLowerCase().includes('admin');
      return hasAdminQuery || hasAdminHash;
    } catch {
      return false;
    }
  };

  // Listen for secret admin URL
  useEffect(() => {
    const handleUrlCheck = () => {
      if (checkIsAdminUrl()) {
        if (!isAdmin) {
          setShowAdminLoginModal(true);
        }
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, [isAdmin]);

  // Admin Logout Handler
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setEditingDonation(null);
    try {
      localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.searchParams.delete('mode');
      if (url.hash.toLowerCase().includes('admin')) {
        url.hash = '';
      }
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    } catch {
      // ignore
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    } catch (e) {
      console.error('Failed to save donations to localStorage', e);
    }
  }, [donations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, isAdmin ? 'true' : 'false');
    } catch (e) {
      // ignore
    }
  }, [isAdmin]);

  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Initialize Supabase realtime sync and remote load
  useEffect(() => {
    // 1. Fetch live records from Supabase if table populated
    fetchDonationsFromSupabase()
      .then(remoteDonations => {
        if (remoteDonations && remoteDonations.length > 0) {
          setDonations(remoteDonations);
        }
      })
      .catch(err => {
        // Table not created or network issue - fallback gracefully to local seed
        console.warn('Initial Supabase fetch skipped:', err.message);
      });

    // 2. Realtime listener for cross-device live updates
    const channel = subscribeToDonationChanges(
      (newDonation) => {
        setDonations(prev => {
          if (prev.some(d => d.id === newDonation.id)) return prev;
          return [newDonation, ...prev];
        });
      },
      (updatedDonation) => {
        setDonations(prev =>
          prev.map(d => (d.id === updatedDonation.id ? updatedDonation : d))
        );
      },
      (deletedId) => {
        setDonations(prev => prev.filter(d => d.id !== deletedId));
      }
    );

    setIsRealtimeActive(true);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Add / Edit donation
  const handleSaveDonation = async (donationData: Omit<Donation, 'id' | 'createdAt'> & { id?: string }) => {
    if (donationData.id) {
      // Update existing
      const existing = donations.find(d => d.id === donationData.id);
      const updatedItem: Donation = {
        ...existing,
        ...donationData,
        id: donationData.id,
        createdAt: existing?.createdAt || Date.now()
      };
      setDonations(prev =>
        prev.map(d => (d.id === donationData.id ? updatedItem : d))
      );
      setEditingDonation(null);
      await saveDonationToSupabase(updatedItem);
    } else {
      // Create new
      const newDonation: Donation = {
        ...donationData,
        id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: Date.now()
      };
      setDonations(prev => [newDonation, ...prev]);
      await saveDonationToSupabase(newDonation);
    }
  };

  // Delete donation
  const handleDeleteDonation = async (id: string): Promise<void> => {
    try {
      // Delete from Supabase cloud database
      await deleteDonationFromSupabase(id);
      // Remove from local state
      setDonations(prev => prev.filter(d => d.id !== id));
      if (editingDonation && editingDonation.id === id) {
        setEditingDonation(null);
      }
    } catch (err: any) {
      console.error('Failed to delete donation from database:', err);
      throw err;
    }
  };

  // Reset to demo data
  const handleResetData = () => {
    setDonations(INITIAL_DONATIONS);
    setSettings(INITIAL_SETTINGS);
    setEditingDonation(null);
  };

  // Import data
  const handleImportData = (newDonations: Donation[]) => {
    setDonations(newDonations);
  };

  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-20 sm:pb-12">
      {/* Top Header */}
      <Header
        isAdmin={isAdmin}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Campaign Announcement Ticker */}
        {settings.announcements && settings.announcements.length > 0 && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-900 shadow-2xs">
            <span className="text-base flex-shrink-0">📢</span>
            <div className="overflow-hidden whitespace-nowrap text-ellipsis flex-1 font-medium">
              <span>{settings.announcements[0]}</span>
            </div>
          </div>
        )}

        {/* Campaign Hero & Stats */}
        <CampaignStats
          donations={donations}
          settings={settings}
          milestones={milestones}
        />

        {/* Admin Management Section - EXCLUSIVELY rendered when authenticated via Secret Admin URL */}
        {isAdmin && (
          <div id="admin-section" className="scroll-mt-20">
            <AdminPanel
              donations={donations}
              settings={settings}
              editingDonation={editingDonation}
              onSaveDonation={handleSaveDonation}
              onDeleteDonation={handleDeleteDonation}
              onCancelEdit={() => setEditingDonation(null)}
              onUpdateSettings={setSettings}
              onResetData={handleResetData}
              onImportData={handleImportData}
              onCloseAdmin={handleAdminLogout}
              isRealtimeActive={isRealtimeActive}
            />
          </div>
        )}

        {/* View Mode Navigation Tabs (Public: Ledger & Villages only) */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ledger'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
            donations={donations}
            onSelectDonation={(donation) => setSelectedDonationForReceipt(donation)}
            isAdmin={isAdmin}
            onEditDonation={(donation) => {
              setEditingDonation(donation);
              setTimeout(() => {
                const el = document.getElementById('admin-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            onDeleteDonation={handleDeleteDonation}
          />
        )}

        {activeTab === 'villages' && (
          <VillageLeaderboard
            donations={donations}
            onSelectVillage={() => setActiveTab('ledger')}
          />
        )}
      </main>

      {/* Floating Action / Mobile Quick Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 sm:hidden flex items-center justify-between no-print shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold leading-tight">Total Collected</div>
            <div className="text-xs font-black text-emerald-800 leading-tight">{formatPKR(totalRaised)}</div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById('admin-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-400 active:scale-95 text-amber-950 text-xs font-extrabold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Donation</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReceiptModal
        donation={selectedDonationForReceipt}
        onClose={() => setSelectedDonationForReceipt(null)}
        projectName={`${settings.projectName} (${settings.routeDescription})`}
      />

      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        expectedUsername={settings.adminUsername || 'admin'}
        expectedPassword={settings.adminPassword || 'Ochor1!'}
        onSuccess={() => {
          setIsAdmin(true);
          setShowAdminLoginModal(false);
          setActiveTab('ledger');
          setTimeout(() => {
            const el = document.getElementById('admin-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }}
      />
    </div>
  );
}
