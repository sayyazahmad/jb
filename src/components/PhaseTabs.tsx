import React from 'react';
import { Donation, DonationPhase } from '../types';
import { PHASES } from '../data/initialData';
import { formatLakhs } from '../utils/formatters';

interface PhaseTabsProps {
  donations: Donation[];
  phase: DonationPhase;
  onChange: (phase: DonationPhase) => void;
}

/** Phase 2 / Phase 1 switcher shared by the public site and the admin donations grid. */
export const PhaseTabs: React.FC<PhaseTabsProps> = ({ donations, phase, onChange }) => (
  <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs" role="tablist" aria-label="Fundraising phase">
    {PHASES.map(p => {
      const active = p.id === phase;
      const count = donations.filter(d => d.phase === p.id).length;
      return (
        <button
          key={p.id}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(p.id)}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-x-1.5 transition-all cursor-pointer ${
            active
              ? 'bg-amber-500 text-emerald-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>
            {p.label} <span className="font-urdu text-xs opacity-90">{p.labelUrdu}</span>
          </span>
          <span className={`text-[10px] sm:text-xs font-semibold ${active ? 'opacity-80' : 'opacity-70'}`}>
            {count} donations • Target {formatLakhs(p.targetGoal)}
          </span>
        </button>
      );
    })}
  </div>
);
