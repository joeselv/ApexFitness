import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error idk i just want this to work
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [react(), eslint()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
