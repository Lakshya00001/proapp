import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { zohoEmailPlugin } from './server/viteEmailPlugin.mjs';

export default defineConfig({
  plugins: [
    react(),
    zohoEmailPlugin()
  ],
  server: {
    port: 3000,
    open: true,
  },
});
