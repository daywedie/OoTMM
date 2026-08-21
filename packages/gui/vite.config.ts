import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
  globals: {
    Buffer: true,
    process: true,
  },
})
  ],
  resolve: {
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': 'buffer',
      // outros aliases se necessário
    },
  },
  worker: {
    format: 'es',   // <-- adicione esta linha
  },
});