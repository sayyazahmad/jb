import React from 'react';
import { Users, Award, Sparkles, HeartHandshake, Target, ReceiptText, Wallet } from 'lucide-react';
import { Donation, Expense, ProjectSettings, RoadMilestone } from '../types';
import { formatPKR, formatLakhs } from '../utils/formatters';

interface CampaignStatsProps {
  donations: Donation[];
  expenses: Expense[];
  settings: ProjectSettings;
  milestones: RoadMilestone[];
  onAddClick?: () => void;
}

export const CampaignStats: React.FC<CampaignStatsProps> = ({
  donations,
  expenses,
  settings
}) => {
  const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const inHand = totalRaised - totalSpent;
  const targetGoal = settings.targetGoal;
  const progressPct = targetGoal > 0 ? (totalRaised / targetGoal) * 100 : 0;
  const remainingToGoal = Math.max(targetGoal - totalRaised, 0);
  const donorCount = donations.length;
  const maxDonation = donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0;

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
              Total Donations Collected / کل جمع شدہ رقم
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

          {/* Target Progress Bar */}
          {targetGoal > 0 && (
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2 text-xs sm:text-sm">
                <span className="text-emerald-200 font-medium flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-300" />
                  <span>Target / ہدف: <strong className="text-white">{formatPKR(targetGoal)}</strong></span>
                  <span className="text-emerald-300/80 hidden sm:inline">({formatLakhs(targetGoal)})</span>
                </span>
                <span className="font-extrabold text-amber-300 text-sm sm:text-base">
                  {progressPct.toFixed(1)}%
                </span>
              </div>
              <div
                className="h-3 sm:h-3.5 w-full rounded-full bg-emerald-950/70 border border-emerald-700/50 overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={targetGoal}
                aria-valuenow={totalRaised}
                aria-label="Progress towards target"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-[width] duration-700"
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>
              <div className="text-[11px] sm:text-xs text-emerald-200/90">
                {remainingToGoal > 0 ? (
                  <span>
                    <strong className="text-white">{formatPKR(remainingToGoal)}</strong> more needed to reach the target
                    <span className="font-urdu ml-1">/ ہدف تک باقی رقم</span>
                  </span>
                ) : (
                  <span className="text-amber-300 font-semibold">🎉 Target reached! / ہدف مکمل</span>
                )}
              </div>
            </div>
          )}

          {/* Sub Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-1">
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
              <div className="text-[10px] sm:text-xs text-emerald-200 truncate mt-0.5">Highest Donation</div>
            </div>

            {/* Construction spending: collected − spent = in hand */}
            <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-700/40 text-center">
              <div className="flex items-center justify-center text-rose-300 mb-1">
                <ReceiptText className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white truncate">{formatPKR(totalSpent)}</div>
              <div className="text-[10px] sm:text-xs text-emerald-200 truncate mt-0.5">Spent / <span className="font-urdu">خرچ</span></div>
            </div>

            <div className="bg-emerald-950/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-emerald-700/40 text-center">
              <div className="flex items-center justify-center text-amber-300 mb-1">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white truncate">{formatPKR(inHand)}</div>
              <div className="text-[10px] sm:text-xs text-emerald-200 truncate mt-0.5">In hand / <span className="font-urdu">موجود رقم</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
