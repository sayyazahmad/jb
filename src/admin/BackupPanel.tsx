import React, { useState } from 'react';
import { Download, Upload, RotateCcw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Donation } from '../types';
import { exportDonationsToCSV } from '../utils/formatters';

interface BackupPanelProps {
  donations: Donation[];
  onImportData: (data: Donation[]) => void;
  onResetData: () => void;
}

export const BackupPanel: React.FC<BackupPanelProps> = ({ donations, onImportData, onResetData }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(donations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `awami_road_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportData(parsed);
            setSuccessToast(`Successfully restored ${parsed.length} donations!`);
            setTimeout(() => setSuccessToast(''), 4000);
          } else {
            setErrorMsg('Invalid JSON backup file structure.');
          }
        } catch (err) {
          setErrorMsg('Failed to parse backup JSON file.');
        }
      };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Backup & Excel</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Export, back up or restore the donation ledger</p>
      </div>

      {successToast && (
        <div className="m-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700/60 rounded-xl text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}


        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CSV Excel Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Export for Village Notice Board (Excel)</span>
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Download a clean spreadsheet containing all {donations.length} transactions, donor names, amounts, and dates.
              </p>
              <button
                type="button"
                onClick={() => exportDonationsToCSV(donations)}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel CSV</span>
              </button>
            </div>

            {/* JSON Full Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Save Offline Backup (JSON)</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Keep a safe backup file on your phone or computer so you never lose village records.
              </p>
              <button
                type="button"
                onClick={handleExportJSON}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-900 dark:hover:bg-slate-600"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data Backup</span>
              </button>
            </div>

            {/* Restore from JSON */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>Restore from Backup File</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Upload a previously saved `.json` file to restore all donations.
              </p>
              <label className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to Sample Data */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Reset to Seed Data</span>
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Re-load the standard Awami Road sample transactions (14 community donations).
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all transactions back to default demo donations?')) {
                    onResetData();
                  }
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Ledger</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};
