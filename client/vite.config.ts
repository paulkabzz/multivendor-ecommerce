import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@src': resolve(__dirname, './src'),
      '@pages': resolve(__dirname, './src/pages'),
      '@assets': resolve(__dirname, './src/assets'),
      '@api': resolve(__dirname, './src/api'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils')
    }
  }
});
