import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  // 🔹 Obligatorio para Netlify + SPA
  base: '/',

  // 🔹 React
  plugins: [react()],

  // 🔹 Resolución de imports
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 🔹 Build para Netlify
  build: {
    target: 'esnext',
    outDir: 'dist',     // 👈 Netlify PUBLICA ESTA CARPETA
    emptyOutDir: true,
    sourcemap: false,
  },

  // 🔹 Dev server (solo local)
  server: {
    port: 3000,
    open: true,
  },
});
