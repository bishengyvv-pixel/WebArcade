import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
      '/roms': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      '/data': 'http://localhost:3001',
    },
  },
});
