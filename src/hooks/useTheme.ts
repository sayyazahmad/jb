import { useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

// Keep in sync with the pre-paint script in index.html
const THEME_KEY = 'awami_road_theme';

const readPreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage unavailable — fall back to system
  }
  return 'system';
};

export const useTheme = () => {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    try {
      if (preference === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Ignore storage errors
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply();

    if (preference !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  const cyclePreference = () => {
    setPreference(p => (p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system'));
  };

  return { preference, cyclePreference };
};
