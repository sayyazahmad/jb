import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Upload,
  Download,
  ShieldCheck,
  Sparkles,
  Link2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Donation } from '../types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from '../services/googleAuth';
import {
  getSavedSpreadsheetId,
  saveSpreadsheetId,
  createDonationsSpreadsheet,
  syncAllDonationsToSheet,
  fetchDonationsFromSheet
} from '../services/googleSheets';
import { formatPKR } from '../utils/formatters';

interface GoogleSheetsSyncProps {
  donations: Donation[];
  onImportDonations: (donations: Donation[]) => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  donations,
  onImportDonations
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSpreadsheetId());
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(
    spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null
  );

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Confirmation Dialog State (MANDATORY per Workspace guidelines)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: async () => {}
  });

  // Manual ID input state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');

  // Init Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Signed in as ${result.user.displayName || result.user.email}. Ready to connect Google Sheets.`
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to sign in with Google'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setAccessToken(null);
    setStatusMessage({ type: 'info', text: 'Signed out of Google account.' });
  };

  // Step 1: Create dedicated Google Sheet (with confirmation dialog)
  const promptCreateSheet = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Create Awami Road Google Sheet?',
      description: `This will create a new official Google Spreadsheet titled "AWAMI ROAD (Jeeva Morh to Butti) - Official Donations Ledger" directly in your Google Drive and format it with headers.`,
      actionLabel: 'Create Spreadsheet',
      onConfirm: async () => {
        setLoading(true);
        setStatusMessage(null);
        try {
          const token = accessToken || (await getAccessToken());
          if (!token) throw new Error('Google session expired. Please sign in again.');

          const { id, url } = await createDonationsSpreadsheet(token);
          setSpreadsheetId(id);
          setSpreadsheetUrl(url);

          // Now immediately sync all current records
          const syncRes = await syncAllDonationsToSheet(token, id, donations);
          setLastSyncedTime(new Date().toLocaleTimeString());
          setStatusMessage({
            type: 'success',
            text: `Alhamdulillah! Google Sheet created and populated with ${syncRes.rowsCount} donation records.`
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Failed to create Google Sheet.'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Step 2: Push sync current donations to sheet (with confirmation dialog)
  const promptPushSync = () => {
    if (!spreadsheetId) {
      promptCreateSheet();
      return;
    }

    const totalRs = donations.reduce((sum, d) => sum + d.amount, 0);

    setConfirmDialog({
      isOpen: true,
      title: 'Sync All Donations to Google Sheet?',
      description: `You are about to write ${donations.length} records totaling ${formatPKR(totalRs)} to your connected Google Sheet. Existing sheet rows will be updated to match the app ledger.`,
      actionLabel: 'Confirm & Sync',
      onConfirm: async () => {
        setLoading(true);
        setStatusMessage(null);
        try {
          const token = accessToken || (await getAccessToken());
          if (!token) throw new Error('Google session expired. Please sign in again.');

          const res = await syncAllDonationsToSheet(token, spreadsheetId, donations);
          setLastSyncedTime(new Date().toLocaleTimeString());
          setStatusMessage({
            type: 'success',
            text: `Successfully synced ${res.rowsCount} donation rows to your Google Sheet!`
          });
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Failed to sync to Google Sheet.'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Step 3: Pull / Import from Google Sheet (with confirmation dialog)
  const promptImportFromSheet = () => {
    if (!spreadsheetId) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Import Records from Google Sheet?',
      description: `This will fetch all rows from your connected Google Sheet and update the local app list. Any new rows entered in the Google Sheet will appear in the app.`,
      actionLabel: 'Import Records',
      onConfirm: async () => {
        setLoading(true);
        setStatusMessage(null);
        try {
          const token = accessToken || (await getAccessToken());
          if (!token) throw new Error('Google session expired. Please sign in again.');

          const fetched = await fetchDonationsFromSheet(token, spreadsheetId);
          if (fetched.length === 0) {
            setStatusMessage({
              type: 'info',
              text: 'No donation records found in the Google Sheet.'
            });
          } else {
            onImportDonations(fetched);
            setLastSyncedTime(new Date().toLocaleTimeString());
            setStatusMessage({
              type: 'success',
              text: `Successfully imported ${fetched.length} donations from Google Sheet!`
            });
          }
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'Failed to import from Google Sheet.'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleLinkManualId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    saveSpreadsheetId(manualId.trim());
    setSpreadsheetId(manualId.trim());
    setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${manualId.trim()}/edit`);
    setShowManualInput(false);
    setStatusMessage({ type: 'success', text: 'Linked existing Google Sheet ID!' });
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-2xl shadow-xs">
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Google Sheets Cloud Storage</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Store, backup, and view all {donations.length} donation records in your own Google Drive spreadsheet.
            </p>
          </div>
        </div>

        {/* Auth status / Sign in button */}
        <div>
          {googleUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                    {googleUser.email?.[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {googleUser.displayName || 'Google User'}
                  </div>
                  <div className="text-[10px] text-slate-500">{googleUser.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title="Disconnect Google Account"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Connected Sheet Card */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Spreadsheet</span>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>AWAMI ROAD - Official Donations Ledger</span>
              {spreadsheetId && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 font-mono px-2 py-0.5 rounded-md">
                  Active
                </span>
              )}
            </div>
            {lastSyncedTime && (
              <span className="text-[11px] text-slate-500 block">
                Last synced at: <strong className="text-slate-700">{lastSyncedTime}</strong> ({donations.length} rows)
              </span>
            )}
          </div>

          {/* Action Links */}
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap">
          {!spreadsheetId ? (
            <button
              type="button"
              onClick={googleUser ? promptCreateSheet : handleSignIn}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{googleUser ? 'Create & Link Google Sheet' : 'Sign in to Create Sheet'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={googleUser ? promptPushSync : handleSignIn}
                disabled={loading}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Sync All ({donations.length}) to Sheet</span>
              </button>

              <button
                type="button"
                onClick={googleUser ? promptImportFromSheet : handleSignIn}
                disabled={loading}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Import from Sheet</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline ml-auto"
          >
            {showManualInput ? 'Hide ID Input' : 'Link Existing Sheet ID'}
          </button>
        </div>

        {/* Manual ID Input */}
        {showManualInput && (
          <form onSubmit={handleLinkManualId} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Paste Google Spreadsheet ID (from URL)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Link ID
            </button>
          </form>
        )}
      </div>

      {/* Confirmation Modal (MANDATORY per Workspace Guidelines) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl z-10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.description}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  await confirmDialog.onConfirm();
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
