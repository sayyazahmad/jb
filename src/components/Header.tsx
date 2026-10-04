import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onLogoutAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onLogoutAdmin
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-lg border-b border-emerald-700/50">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Project Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-500 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-emerald-950 rounded-[14px] flex items-center justify-center">
                <span className="text-xl sm:text-2xl" role="img" aria-label="road">🛣️</span>
              </div>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  AWAMI ROAD
                </h1>
                <span className="font-urdu text-xs sm:text-sm text-emerald-200 font-semibold px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-700/60 hidden xs:inline-block">
                  عوامی سڑک
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium truncate flex items-center gap-1">
                <span>Jeeva Morh to Butti</span>
                <span className="text-emerald-400 font-bold">•</span>
                <span className="text-amber-300 text-xs">جیوا موڑ تا بٹی</span>
              </p>
            </div>
          </div>

          {/* Only shown if Admin is actively logged in */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Active</span>
              </span>
              {onLogoutAdmin && (
                <button
                  onClick={onLogoutAdmin}
                  title="Exit Admin Mode"
                  className="px-2.5 py-1 rounded-xl text-xs text-emerald-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
