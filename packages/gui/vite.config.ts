import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),  // se já estiver presente
  ],
  resolve: {
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': 'buffer',
      // Se houver outros shims problemáticos, adicione também:
      // 'vite-plugin-node-polyfills/shims/process': 'process/browser',
    },
  },
  // ... outras configurações
});