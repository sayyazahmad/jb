import React from 'react';
import { MapPin, Trophy, Wallet, Users, ChevronRight, TrendingUp } from 'lucide-react';
import { Donation } from '../types';
import { formatPKR, formatLakhs, getSourceDetails } from '../utils/formatters';

interface VillageLeaderboardProps {
  donations: Donation[];
  onSelectVillage?: (village: string) => void;
}

export const VillageLeaderboard: React.FC<VillageLeaderboardProps> = ({
  donations,
  onSelectVillage
}) => {
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  // Group by village
  const villageStats = React.useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    donations.forEach(d => {
      const v = d.villageName.trim();
      const current = map.get(v) || { total: 0, count: 0 };
      map.set(v, {
        total: current.total + d.amount,
        count: current.count + 1
      });
    });

    const arr = Array.from(map.entries()).map(([village, stats]) => ({
      village,
      total: stats.total,
      count: stats.count,
      pct: totalAmount > 0 ? Math.round((stats.total / totalAmount) * 100) : 0
    }));

    return arr.sort((a, b) => b.total - a.total);
  }, [donations, totalAmount]);

  // Group by payment source
  const sourceStats = React.useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    donations.forEach(d => {
      const s = d.source;
      const current = map.get(s) || { total: 0, count: 0 };
      map.set(s, {
        total: current.total + d.amount,
        count: current.count + 1
      });
    });

    return Array.from(map.entries()).map(([source, stats]) => ({
      source,
      total: stats.total,
      count: stats.count,
      pct: totalAmount > 0 ? Math.round((stats.total / totalAmount) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [donations, totalAmount]);

  return (
    <div className="space-y-4">
      {/* Village Contributions Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Village Contributions Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-500 font-urdu">
              گاؤں وار کل فنڈز اور حصہ داری
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {villageStats.length} Areas
          </span>
        </div>

        <div className="space-y-3">
          {villageStats.map((item, idx) => {
            const isLeader = idx === 0;
            return (
              <div
                key={item.village}
                onClick={() => onSelectVillage && onSelectVillage(item.village)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isLeader
                    ? 'bg-gradient-to-r from-amber-50/50 to-emerald-50/30 border-amber-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 shadow-2xs' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <strong className="text-sm font-bold text-slate-800 truncate">
                      {item.village}
                    </strong>
                    {isLeader && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Leading Village
                      </span>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-extrabold text-emerald-800 block">
                      {formatPKR(item.total)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.count} donors ({item.pct}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLeader ? 'bg-gradient-to-r from-amber-400 to-emerald-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.max(4, item.pct)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Sources Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>Payment Channel Breakdown (ذرائع وصولی)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {sourceStats.map(item => {
            const details = getSourceDetails(item.source as any);
            return (
              <div key={item.source} className={`p-3 rounded-2xl border ${details.badgeBg} ${details.badgeBorder}`}>
                <div className="text-xs font-bold text-slate-700 truncate">{details.label}</div>
                <div className="text-base font-extrabold text-slate-900 mt-1">
                  {formatLakhs(item.total)}
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between mt-0.5">
                  <span>{item.count} gifts</span>
                  <span className="font-semibold">{item.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
