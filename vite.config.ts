import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // HMR 在 AI Studio 中通过 DISABLE_HMR 环境变量禁用
    hmr: process.env.DISABLE_HMR !== 'true',
    // 将 /api/* 请求代理到后端 Express 服务（API Key 在服务端安全读取）
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.SERVER_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
});
