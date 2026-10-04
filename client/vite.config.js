import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, requests to /api and /ws are forwarded to the Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
      },
    },
  },
});
