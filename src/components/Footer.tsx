import React from 'react';

// Small developer credit, bottom-left of the page. Shared by the public site and the admin app.
export const Footer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <footer className={`max-w-5xl mx-auto px-3 sm:px-6 pt-6 text-left no-print ${className}`}>
    <p className="text-[11px] text-slate-400 dark:text-slate-500">Developed by: Sayyaz Ahmad</p>
  </footer>
);
