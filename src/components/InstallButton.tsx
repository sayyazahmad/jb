import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Chromium-only event (Chrome, Edge, Android); not in the TS DOM lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Install" button for the PWA. Only appears when the browser says the app can be installed;
 * iOS Safari has no such event (users use Share → Add to Home Screen), so it never shows there.
 */
export const InstallButton: React.FC = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the event so the button can show the prompt later
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  const handleInstall = async () => {
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null); // a prompt event can only be used once
  };

  return (
    <button
      onClick={handleInstall}
      title="Install as an app"
      aria-label="Install as an app"
      className="no-print px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
};
