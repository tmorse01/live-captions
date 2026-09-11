import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    host: true,
    // Mobile browsers require HTTPS for getUserMedia (except localhost).
    proxy: {
      '/ws': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
