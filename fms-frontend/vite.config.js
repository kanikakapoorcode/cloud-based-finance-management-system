// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' data:; " +
        "media-src 'self' data: blob:; " +
        "connect-src 'self' http://localhost:5001;"
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});