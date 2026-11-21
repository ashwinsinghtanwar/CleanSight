import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks only to :5173; Vite forwards API + image requests to FastAPI on :8000
// (so there are no CORS problems and no URL to configure).
const target = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/uploads': { target, changeOrigin: true },
    },
  },
});
