import { useEffect, useState } from 'react';
import { Donation, ProjectSettings } from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import {
  saveDonationToSupabase,
  insertDonationToSupabase,
  deleteDonationFromSupabase,
  fetchDonationsFromSupabase,
  subscribeToDonationChanges,
  supabase
} from '../services/supabase';

// v4: no seed data any more; older caches may still hold the old seed records, so they're ignored and removed
const STORAGE_KEY_DONATIONS = 'awami_road_donations_v4';
const LEGACY_DONATION_KEYS = ['awami_road_donations_v3'];
const STORAGE_KEY_SETTINGS = 'awami_road_settings_v3';

export type DonationInput = Omit<Donation, 'id' | 'createdAt'> & { id?: string };

/**
 * Shared donation store for the public and admin apps:
 * localStorage cache + Supabase load + realtime sync + optimistic save/delete.
 */
export const useDonations = () => {
  // Start from the local cache of the last Supabase load (no seed data); Supabase replaces it on mount
  const [donations, setDonations] = useState<Donation[]>(() => {
    try {
      LEGACY_DONATION_KEYS.forEach(key => localStorage.removeItem(key));
      const saved = localStorage.getItem(STORAGE_KEY_DONATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load local storage donations', e);
    }
    return [];
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
    // 1. Fetch live records from Supabase (the source of truth, even when empty)
    fetchDonationsFromSupabase()
      .then(remoteDonations => {
        setDonations(remoteDonations || []);
      })
      .catch(err => {
        // Table not created or network issue - keep whatever the local cache had
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
      // Create new: the database assigns the next sequential id, so add it once the insert returns
      // (the realtime INSERT event may arrive first; skip it if so)
      const { id: _none, ...fields } = donationData;
      const created = await insertDonationToSupabase({ ...fields, createdAt: Date.now() });
      setDonations(prev => (prev.some(d => d.id === created.id) ? prev : [created, ...prev]));
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
