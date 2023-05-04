import { sveltekit } from '@sveltejs/kit/vite'

/** @type {import('vite').UserConfigFn} */
const defineConfig = ({ mode }) => ({
  plugins: [sveltekit()],
  server: {
    port: process.env.DEV_PORT,
  },
  ssr:
    mode === 'development'
      ? {
          external: [
            '@neondatabase/serverless',
            'drizzle-orm',
            'drizzle-orm/neon-serverless',
            'drizzle-orm/node-postgres',
            'drizzle-orm/pg-core',
            'pg',
          ],
        }
      : undefined,
})

export default defineConfig
