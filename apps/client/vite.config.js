import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  build: { sourcemap: false, },
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) },
  server: { 
    host: true, hmr: { overlay: true, },
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true, secure: false, } }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src'), },
  },
});
