import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
  },
  optimizeDeps: {
    include: ['phaser'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
