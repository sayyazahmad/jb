import React from 'react';
import { Users, TrendingUp, Award, Sparkles, HeartHandshake } from 'lucide-react';
import { Donation, ProjectSettings, RoadMilestone } from '../types';
import { formatPKR, formatLakhs } from '../utils/formatters';

interface CampaignStatsProps {
  donations: Donation[];
  settings: ProjectSettings;
  milestones: RoadMilestone[];
  onAddClick?: () => void;
}

export const CampaignStats: React.FC<CampaignStatsProps> = ({
  donations
}) => {
  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
  const donorCount = donations.length;
  const maxDonation = donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0;
  const avgDonation = donations.length > 0 ? Math.round(totalRaised / donations.length) : 0;

  return (
    <div className="space-y-4">
      {/* Hero Stats Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/60 relative overflow-hidden">
        {/* Subtle decorative background road lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path d="M 0 160 Q 150 120 250 80 T 400 40" stroke="white" strokeWidth="24" strokeDasharray="16 12" fill="none" />
            <path d="M 0 160 Q 150 120 250 80 T 400 40" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 space-y-5">
          {/* Top badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Village Road Construction Fund</span>
              <span className="text-amber-300 font-urdu ml-1">فنڈ برائے پکی سڑک</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 border border-emerald-500/20 text-emerald-200 text-xs font-medium">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              <span>Community Self-Help Initiative</span>
            </div>
          </div>

          {/* Main Total Display */}
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-medium uppercase tracking-wider text-emerald-200/90 block">
              Total Offline Donations Collected / کل جمع شدہ رقم
            </span>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                {formatPKR(totalRaised)}
              </span>
              <span className="text-emerald-300 text-base sm:text-lg font-semibold bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-700/50">
                {formatLakhs(totalRaised)}
              </span>
            </div>
          </div>

          {/* Sub Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
            <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-700/40 text-center">
              <div className="flex items-center justify-center text-amber-300 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">{donorCount}</div>
              <div className="text-[10px] sm:text-xs text-emerald-200 truncate mt-0.5">Total Donors</div>
            </div>

            <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-700/40 text-center">
              <div className="flex items-center justify-center text-amber-300 mb-1">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white truncate">
                {formatPKR(maxDonation)}
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-200 truncate mt-0.5">Highest Gift</div>
            </div>

            <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-700/40 text-center">
              <div className="flex items-center justify-center text-amber-300 mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white truncate">
                {formatPKR(avgDonation)}
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-200 truncate mt-0.5">Average Contribution</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
