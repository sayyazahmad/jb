import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const THEME_OPTIONS = {
  system: { icon: Monitor, label: 'System theme' },
  light: { icon: Sun, label: 'Light theme' },
  dark: { icon: Moon, label: 'Dark theme' },
} as const;

interface HeaderProps {
  /** Extra buttons shown before the theme toggle (e.g. admin logout) */
  actions?: React.ReactNode;
  /** Optional row rendered under the brand bar (e.g. admin navigation) */
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ actions, children }) => {
  const { preference, cyclePreference } = useTheme();
  const theme = THEME_OPTIONS[preference];
  const ThemeIcon = theme.icon;

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
                <span>GEWA Morh to Butti</span>
                <span className="text-emerald-400 font-bold">•</span>
                <span className="text-amber-300 text-xs">جیوا موڑ تا بٹی</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}

            {/* Theme toggle: System → Light → Dark */}
            <button
              onClick={cyclePreference}
              title={`${theme.label} (click to change)`}
              aria-label={theme.label}
              className="no-print w-9 h-9 rounded-xl text-emerald-100 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center cursor-pointer"
            >
              <ThemeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
};
