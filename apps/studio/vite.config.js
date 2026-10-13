import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: false,
  // Linked Engine modules load these dependencies lazily. Prepare them together
  // at startup so opening a preview cannot invalidate an already-served bundle.
  optimizeDeps: { include: ['gsap', 'pixi.js'] },
  cacheDir: fileURLToPath(new URL(mode === 'e2e' ? '../../node_modules/.vite-studio-e2e' : '../../node_modules/.vite-studio', import.meta.url)),
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:' + (process.env.API_PORT || 3000) },
    fs: {
      strict: true,
      allow: ['.', '../../packages/schemas', '../../packages/engine', '../../node_modules'].map(part => fileURLToPath(new URL(part, import.meta.url))),
      deny: ['**/.env', '**/.env.*', '**/.local/**', '**/.git/**', '**/apps/api/**',
        '**/.npmrc', '**/.yarnrc.yml', '**/*.{crt,pem,key,p12,pfx,cer,der}'],
    },
  },
}));
