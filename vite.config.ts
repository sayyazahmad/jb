import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

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
    plugins: [
      adminFallback(),
      react(),
      tailwindcss(),
      // Service worker only. The two web manifests are static files (public/manifest.webmanifest and
      // public/admin/manifest.webmanifest) linked from each HTML page, so the public site and /admin
      // install as separate apps.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          // Precache only what the two HTML pages load up front. Lazy chunks (the admin-only Excel/PDF
          // export libraries, ~1 MB) are left out so public visitors don't download them; the
          // hashed-assets route below caches them on first use instead.
          manifestTransforms: [
            async (entries) => {
              const referenced = new Set(
                ['index.html', 'admin/index.html'].flatMap(page =>
                  [...fs.readFileSync(path.resolve(__dirname, 'dist', page), 'utf8').matchAll(/assets\/[^"']+/g)].map(m => m[0])
                )
              );
              const manifest = entries.filter(e => !e.url.startsWith('assets/') || referenced.has(e.url));
              return {manifest, warnings: []};
            },
          ],
          // Public SPA: serve the cached shell for navigations; /admin has its own shell (precached
          // as admin/index.html) and its deep links go network-first below.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/admin/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({request, url}) => request.mode === 'navigate' && url.pathname.startsWith('/admin'),
              handler: 'NetworkFirst',
              options: {cacheName: 'admin-pages', networkTimeoutSeconds: 4},
            },
            {
              // Content-hashed build output never changes, so cache-first is safe
              urlPattern: ({url}) => url.pathname.startsWith('/assets/'),
              handler: 'CacheFirst',
              options: {cacheName: 'lazy-assets', expiration: {maxEntries: 40}},
            },
            {
              urlPattern: ({url}) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
              handler: 'StaleWhileRevalidate',
              options: {cacheName: 'google-fonts', expiration: {maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365}},
            },
          ],
        },
      }),
    ],
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
