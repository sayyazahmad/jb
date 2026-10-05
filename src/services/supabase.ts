import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Donation, PaymentSource } from '../types';

// Supabase project credentials (with environment variable support and direct fallbacks)
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

export const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://hyrhdahslleditthpqni.supabase.co');
export const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable__DRMyyi-MEWUY_c2UyQ69w_0YGRVQIO');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export interface SupabaseDonationRow {
  id: string;
  donor_name: string;
  village_name: string;
  amount: number;
  source: string;
  reference: string | null;
  date: string;
  notes: string | null;
  verified_by: string | null;
  referred_by: string | null;
  is_anonymous: boolean;
  created_at: number;
}

// Convert frontend Donation to Supabase DB Row
export const toDbRow = (d: Donation): SupabaseDonationRow => ({
  id: d.id,
  donor_name: d.donorName,
  village_name: d.villageName,
  amount: d.amount,
  source: d.source,
  reference: d.reference || null,
  date: d.date,
  notes: d.notes || null,
  verified_by: d.verifiedBy || null,
  referred_by: d.referredBy || null,
  is_anonymous: !!d.isAnonymous,
  created_at: d.createdAt || Date.now()
});

// Convert Supabase DB Row back to frontend Donation
export const fromDbRow = (row: any): Donation => {
  const sourceVal = row.source || 'Easypesa';
  const validSource: PaymentSource = ['Cash', 'BankTransfer', 'Easypesa', 'Jazzcash', 'Material', 'Remaining'].includes(sourceVal)
    ? (sourceVal as PaymentSource)
    : 'Easypesa';

  return {
    id: String(row.id),
    donorName: row.donor_name || row.donorName || 'Anonymous',
    villageName: row.village_name || row.villageName || 'Khushi Kot',
    amount: Number(row.amount) || 0,
    source: validSource,
    reference: row.reference || '',
    date: row.date || new Date().toISOString().split('T')[0],
    notes: row.notes || '',
    verifiedBy: row.verified_by || row.verifiedBy || '',
    referredBy: row.referred_by || row.referredBy || '',
    isAnonymous: !!(row.is_anonymous ?? row.isAnonymous),
    createdAt: typeof row.created_at === 'number' ? row.created_at : Date.now()
  };
};

/**
 * Test connectivity with Supabase project
 */
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  tableExists: boolean;
  rowCount?: number;
  error?: string;
}> => {
  try {
    const { data, error, count } = await supabase
      .from('donations')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // Check if table missing
      if (error.code === '42P01' || error.message.includes('relation "public.donations" does not exist') || error.message.includes('not found')) {
        return {
          connected: true,
          tableExists: false,
          error: 'Table "donations" does not exist yet. Please run the SQL setup script.'
        };
      }
      return {
        connected: false,
        tableExists: false,
        error: error.message
      };
    }

    return {
      connected: true,
      tableExists: true,
      rowCount: count ?? (data?.length || 0)
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      error: err?.message || 'Failed to connect to Supabase'
    };
  }
};

/**
 * Fetch all donations from Supabase
 */
export const fetchDonationsFromSupabase = async (): Promise<Donation[]> => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(fromDbRow);
};

/**
 * Upsert a single donation into Supabase
 */
export const saveDonationToSupabase = async (donation: Donation): Promise<void> => {
  const row = toDbRow(donation);
  const { error } = await supabase.from('donations').upsert(row, { onConflict: 'id' });
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Delete a donation from Supabase
 */
export const deleteDonationFromSupabase = async (id: string): Promise<void> => {
  const { error } = await supabase.from('donations').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Batch upload donations to Supabase (chunks of 50 for safety)
 */
export const batchUploadDonationsToSupabase = async (
  donations: Donation[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<{ success: boolean; count: number }> => {
  const chunkSize = 50;
  let totalUploaded = 0;

  for (let i = 0; i < donations.length; i += chunkSize) {
    const chunk = donations.slice(i, i + chunkSize).map(toDbRow);
    const { error } = await supabase.from('donations').upsert(chunk, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed uploading chunk at ${i}: ${error.message}`);
    }

    totalUploaded += chunk.length;
    if (onProgress) {
      onProgress(totalUploaded, donations.length);
    }
  }

  return { success: true, count: totalUploaded };
};

/**
 * Setup Realtime listener for live updates across all devices
 */
export const subscribeToDonationChanges = (
  onInsert: (donation: Donation) => void,
  onUpdate: (donation: Donation) => void,
  onDelete: (id: string) => void
): RealtimeChannel => {
  return supabase
    .channel('public:donations')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'donations' },
      (payload) => {
        onInsert(fromDbRow(payload.new));
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'donations' },
      (payload) => {
        onUpdate(fromDbRow(payload.new));
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'donations' },
      (payload) => {
        onDelete(String(payload.old?.id));
      }
    )
    .subscribe();
};

/**
 * Complete SQL script to set up Supabase table and public RLS policies
 */
export const SUPABASE_SQL_SETUP = `-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/hyrhdahslleditthpqni/sql):

create table if not exists public.donations (
  id text primary key,
  donor_name text not null,
  village_name text not null,
  amount bigint not null,
  source text not null,
  reference text,
  date text not null,
  notes text,
  verified_by text,
  referred_by text,
  is_anonymous boolean not null default false,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Migration for tables created before the anonymous flag existed
alter table public.donations add column if not exists is_anonymous boolean not null default false;
alter table public.donations add column if not exists referred_by text;
alter table public.donations drop column if exists receipt_number;

-- Enable Row Level Security (RLS)
alter table public.donations enable row level security;

-- Public read access (Anyone can view the ledger)
create policy "Allow public read" on public.donations
  for select using (true);

-- Public write access (Admin / App can save, update, and delete)
create policy "Allow public insert" on public.donations
  for insert with check (true);

create policy "Allow public update" on public.donations
  for update using (true);

create policy "Allow public delete" on public.donations
  for delete using (true);

-- Enable Realtime publication so all connected devices update live:
alter publication supabase_realtime add table public.donations;
`;
