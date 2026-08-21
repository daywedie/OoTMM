import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // import nomeado

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),  // agora funciona
  ],
  resolve: {
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': 'buffer',
      // Se necessário, adicione outros shims, ex:
      // 'vite-plugin-node-polyfills/shims/process': 'process/browser',
    },
  },
  // ... outras opções que já existirem (build, server, etc.)
});