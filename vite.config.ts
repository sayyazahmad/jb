import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// Serve admin/index.html for /admin and its client-side routes (e.g. /admin/edit/123) in dev/preview.
// Production does the same via the rewrite in vercel.json.
const adminFallback = (): Plugin => {
  const rewrite = (req: {url?: string}, _res: unknown, next: () => void) => {
    const pathname = (req.url || '').split('?')[0];
    if ((pathname === '/admin' || pathname.startsWith('/admin/')) && !path.extname(pathname)) {
      req.url = '/admin/index.html';
    }
    next();
  };
  return {
    name: 'admin-spa-fallback',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
};

export default defineConfig(() => {
  return {
    plugins: [adminFallback(), react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
