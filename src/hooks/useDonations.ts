import { useEffect, useState } from 'react';
import { Donation, ProjectSettings } from '../types';
import { INITIAL_DONATIONS, INITIAL_SETTINGS } from '../data/initialData';
import {
  saveDonationToSupabase,
  deleteDonationFromSupabase,
  fetchDonationsFromSupabase,
  subscribeToDonationChanges,
  supabase
} from '../services/supabase';

const STORAGE_KEY_DONATIONS = 'awami_road_donations_v3';
const STORAGE_KEY_SETTINGS = 'awami_road_settings_v3';

export type DonationInput = Omit<Donation, 'id' | 'createdAt'> & { id?: string };

/**
 * Shared donation store for the public and admin apps:
 * localStorage cache + Supabase load + realtime sync + optimistic save/delete.
 */
export const useDonations = () => {
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
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  // True once the initial Supabase fetch has finished (successfully or not)
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(donations));
    } catch (e) {
      console.error('Failed to save donations to localStorage', e);
    }
  }, [donations]);

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
      })
      .finally(() => setIsLoaded(true));

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
  const saveDonation = async (donationData: DonationInput) => {
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
  const deleteDonation = async (id: string): Promise<void> => {
    try {
      // Delete from Supabase cloud database
      await deleteDonationFromSupabase(id);
      // Remove from local state
      setDonations(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      console.error('Failed to delete donation from database:', err);
      throw err;
    }
  };

  return { donations, setDonations, saveDonation, deleteDonation, isRealtimeActive, isLoaded };
};

/** Project settings (target, committee, admin credentials) — localStorage only, not synced to Supabase. */
export const useSettings = () => {
  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  return { settings, setSettings };
};
