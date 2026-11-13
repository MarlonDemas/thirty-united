import path from 'node:path'
import { defineConfig } from 'vite'

const NOT_PROD =
  'Refusing to build: NODE_ENV=%s makes import.meta.env.DEV true, so every dev gate (closedReasons dev, window.__rsvp) would ship. Unset NODE_ENV or use `pnpm build`.'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // Vite gives DEV=true to any build whose NODE_ENV is not "production" (`NODE_ENV=development vite build`); unset is fine, Vite defaults it to production before this runs.
  if (command === 'build' && process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
    throw new Error(NOT_PROD.replace('%s', process.env.NODE_ENV))
  }
  return {
    server: { port: 5173, strictPort: true },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    plugins: [
      {
        // A NODE_ENV=development line in a .env file flips NODE_ENV after this config has loaded, so the check above never sees it; the resolved isProduction does.
        name: 'build-guard',
        apply: 'build',
        configResolved(c) {
          if (!c.isProduction) throw new Error(NOT_PROD.replace('%s', process.env.NODE_ENV ?? 'development'))
        },
      },
    ],
  }
})
