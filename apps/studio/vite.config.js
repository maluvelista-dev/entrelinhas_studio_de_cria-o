import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  publicDir: false,
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
});
