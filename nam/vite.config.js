import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Explicitly use automatic JSX runtime (React 17+)
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  esbuild: {
    loader: 'jsx', // Handle .js and .jsx files as JSX
    include: /src\/.*\.(js|jsx)$/, // Include both .js and .jsx files
  },
});