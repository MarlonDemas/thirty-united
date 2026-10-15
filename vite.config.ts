import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks: their hashes only change when the library does, so a returning guest's cache
        // (immutable /assets/*) keeps them across app deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](?:\.pnpm[\\/])?(?:react|react-dom|scheduler)[@\\/]/.test(id)) return 'vendor-react'
          if (/[\\/]node_modules[\\/](?:\.pnpm[\\/])?(?:motion|motion-dom|motion-utils|framer-motion)[@\\/]/.test(id)) return 'vendor-motion'
          if (/[\\/]node_modules[\\/](?:\.pnpm[\\/])?(?:three|@react-three\+fiber|@react-three[\\/]fiber)[@\\/]/.test(id)) return 'vendor-three'
        },
      },
    },
  },
})
