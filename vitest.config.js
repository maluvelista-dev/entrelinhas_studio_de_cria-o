import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], test: {
  include: ['packages/**/*.test.js', 'apps/**/*.test.{js,jsx}'],
  environment: 'node', testTimeout: 10000,
} });
