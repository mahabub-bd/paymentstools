import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large vendor dependencies into separate chunks
          if (id.includes('node_modules')) {
            // Excel libraries (xlsx, xlsx-js-style)
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // Crypto library
            if (id.includes('crypto-js')) {
              return 'vendor-crypto';
            }
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Form validation
            if (id.includes('zod') || id.includes('@hookform') || id.includes('react-hook-form')) {
              return 'vendor-forms';
            }
            // Other vendor libs
            return 'vendor';
          }
        }
      }
    }
  }
})
