import { resolve } from 'path';
import { defineConfig } from 'vite';

// Multi-page (MPA) build: landing + páginas legales.
export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terminos: resolve(__dirname, 'terminos.html'),
        privacidad: resolve(__dirname, 'privacidad.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
