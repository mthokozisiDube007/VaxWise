import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
