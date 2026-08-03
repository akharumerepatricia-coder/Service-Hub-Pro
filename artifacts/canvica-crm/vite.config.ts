import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// import.meta.dirname requires Node ≥ 20.11 — use fileURLToPath for compatibility
const __dirname = dirname(fileURLToPath(import.meta.url));

// During `vite build` (e.g. Vercel CI), PORT is not needed — the dev-server
// config is ignored. Default to 3000 so the config evaluates without throwing.
const isBuild = process.argv.some((a) => a === 'build');

const rawPort = process.env.PORT;

if (!isBuild && !rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = rawPort ? Number(rawPort) : 3000;

if (!isBuild && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// BASE_PATH defaults to '/' for production builds (Vercel, etc.).
// In the Replit dev environment BASE_PATH is set explicitly via the artifact config.
const basePath = process.env.BASE_PATH ?? '/';

const outDir = resolve(__dirname, 'dist');

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Only include the Replit runtime error overlay in development
    ...(process.env.NODE_ENV !== 'production'
      ? [
          (await import('@replit/vite-plugin-runtime-error-modal')).default(),
        ]
      : []),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: resolve(__dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, '..', '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: resolve(__dirname),
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
