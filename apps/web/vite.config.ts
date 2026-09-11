import path from 'node:path';
import { fileURLToPath } from 'node:url';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `vite --mode network` → HTTPS + LAN (phone mic). Default → HTTP localhost only. */
export default defineConfig(({ mode }) => {
  const networkDev = mode === 'network';

  return {
    envDir: path.resolve(__dirname, '../..'),
    plugins: [react(), ...(networkDev ? [basicSsl()] : [])],
    server: {
      port: 5173,
      host: networkDev ? true : 'localhost',
      proxy: {
        '/ws': {
          target: 'http://localhost:3001',
          ws: true,
        },
      },
    },
  };
});
