import { useEffect, useState } from 'react';

// Minimal history-based router for the admin app, mounted under /admin.
// Deep links (e.g. /admin/edit/abc) are rewritten to admin/index.html by vercel.json in production
// and by the adminFallback plugin in vite.config.ts during development.
export const ADMIN_BASE = '/admin';

export type AdminRoute =
  | { name: 'list' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'backup' };

export const parseAdminRoute = (pathname: string): AdminRoute => {
  const sub = pathname.startsWith(ADMIN_BASE) ? pathname.slice(ADMIN_BASE.length) : pathname;
  const parts = sub.split('/').filter(Boolean);
  if (parts[0] === 'new') return { name: 'new' };
  if (parts[0] === 'edit' && parts[1]) return { name: 'edit', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'backup') return { name: 'backup' };
  return { name: 'list' };
};

export const adminPath = (route: AdminRoute): string => {
  switch (route.name) {
    case 'new': return `${ADMIN_BASE}/new`;
    case 'edit': return `${ADMIN_BASE}/edit/${encodeURIComponent(route.id)}`;
    case 'backup': return `${ADMIN_BASE}/backup`;
    default: return `${ADMIN_BASE}/`;
  }
};

const NAV_EVENT = 'admin:navigate';

export const navigate = (route: AdminRoute) => {
  window.history.pushState({}, '', adminPath(route));
  window.dispatchEvent(new Event(NAV_EVENT));
  window.scrollTo({ top: 0 });
};

export const useAdminRoute = (): AdminRoute => {
  const [route, setRoute] = useState(() => parseAdminRoute(window.location.pathname));

  useEffect(() => {
    const update = () => setRoute(parseAdminRoute(window.location.pathname));
    window.addEventListener('popstate', update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);

  return route;
};
