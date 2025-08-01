import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 5173, // Match the frontend port from logs
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend URL
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000', // Socket.io backend URL
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.(js|jsx)$/,
  },
});