import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Radio,
  Sparkles,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { Donation } from '../types';
import {
  SUPABASE_URL,
  testSupabaseConnection,
  fetchDonationsFromSupabase,
  batchUploadDonationsToSupabase,
  SUPABASE_SQL_SETUP
} from '../services/supabase';
import { formatPKR } from '../utils/formatters';

interface SupabaseSyncProps {
  donations: Donation[];
  onImportDonations: (donations: Donation[]) => void;
  isRealtimeActive: boolean;
}

export const SupabaseSync: React.FC<SupabaseSyncProps> = ({
  donations,
  onImportDonations,
  isRealtimeActive
}) => {
  const [status, setStatus] = useState<{
    loading: boolean;
    connected: boolean;
    tableExists: boolean;
    rowCount?: number;
    error?: string;
  }>({
    loading: true,
    connected: false,
    tableExists: false
  });

  const [syncing, setSyncing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: undefined }));
    const result = await testSupabaseConnection();
    setStatus({
      loading: false,
      connected: result.connected,
      tableExists: result.tableExists,
      rowCount: result.rowCount,
      error: result.error
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handlePushAllToSupabase = async () => {
    if (donations.length === 0) return;
    setSyncing(true);
    setToast(null);
    setUploadProgress({ current: 0, total: donations.length });

    try {
      const res = await batchUploadDonationsToSupabase(donations, (curr, tot) => {
        setUploadProgress({ current: curr, total: tot });
      });

      setToast({
        type: 'success',
        text: `Alhamdulillah! Uploaded ${res.count} donations into your Supabase database successfully.`
      });
      await checkConnection();
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.message || 'Failed to upload records to Supabase'
      });
    } finally {
      setSyncing(false);
      setUploadProgress(null);
    }
  };

  const handleFetchFromSupabase = async () => {
    setSyncing(true);
    setToast(null);
    try {
      const rows = await fetchDonationsFromSupabase();
      if (rows.length === 0) {
        setToast({
          type: 'info',
          text: 'The Supabase donations table is currently empty. Use "Push All" to upload local records.'
        });
      } else {
        onImportDonations(rows);
        setToast({
          type: 'success',
          text: `Fetched ${rows.length} live records from Supabase into your app!`
        });
        await checkConnection();
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.message || 'Failed to fetch rows from Supabase'
      });
    } finally {
      setSyncing(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const totalRs = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-2xl shadow-xs">
            <Database className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Supabase Cloud Database</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cloud SQL backend powering real-time synchronization across all mobile phones and web browsers.
            </p>
          </div>
        </div>

        {/* Live Realtime Indicator */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-800">
            {isRealtimeActive ? 'Realtime Active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Endpoint</span>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-800 truncate">
              {SUPABASE_URL}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkConnection}
              disabled={status.loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? 'animate-spin' : ''}`} />
              <span>Test Ping</span>
            </button>

            <a
              href="https://supabase.com/dashboard/project/hyrhdahslleditthpqni"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Database Status details */}
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            {status.connected && status.tableExists ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Table 'public.donations' is live ({status.rowCount ?? 0} rows stored)</span>
              </span>
            ) : status.connected && !status.tableExists ? (
              <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Database connected, but table 'donations' needs to be created</span>
              </span>
            ) : status.loading ? (
              <span className="text-slate-500">Checking Supabase connection...</span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{status.error || 'Connection error'}</span>
              </span>
            )}
          </div>

          {!status.tableExists && (
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>View SQL Setup Script</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Progress Bar during Batch Upload */}
      {uploadProgress && (
        <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex justify-between text-xs font-bold text-emerald-900">
            <span>Uploading records to Supabase...</span>
            <span>
              {uploadProgress.current} / {uploadProgress.total} (
              {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handlePushAllToSupabase}
          disabled={syncing || status.loading}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Push All ({donations.length}) Records to Supabase</span>
        </button>

        <button
          type="button"
          onClick={handleFetchFromSupabase}
          disabled={syncing || status.loading}
          className="px-4 py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Pull Live from Supabase</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSqlModal(true)}
          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto"
        >
          <Terminal className="w-3.5 h-3.5 text-slate-600" />
          <span>SQL Script</span>
        </button>
      </div>

      {/* SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowSqlModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">Supabase SQL Table Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              If your database does not have the <code>donations</code> table created yet, copy this script and run it once in your{' '}
              <a
                href="https://supabase.com/dashboard/project/hyrhdahslleditthpqni/sql"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5"
              >
                <span>Supabase SQL Editor</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              :
            </p>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-emerald-300 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {SUPABASE_SQL_SETUP}
              </pre>
              <button
                type="button"
                onClick={copySql}
                className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
