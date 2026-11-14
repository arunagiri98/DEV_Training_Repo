import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In local dev, forward /api requests to the Express server.
    // In production, vercel.json does this routing instead.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
