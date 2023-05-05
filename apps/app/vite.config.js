import { sveltekit } from '@sveltejs/kit/vite'

if (
  process.env.LD_LIBRARY_PATH == null ||
  !process.env.LD_LIBRARY_PATH.includes(`${process.env.PWD}/node_modules/canvas/build/Release:`)
) {
  process.env.LD_LIBRARY_PATH = `${process.env.PWD}/node_modules/canvas/build/Release:${
    process.env.LD_LIBRARY_PATH || ''
  }`
}

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
            'boolbase',
            'canvas',
            'drizzle-orm',
            'drizzle-orm/neon-serverless',
            'drizzle-orm/node-postgres',
            'drizzle-orm/pg-core',
            'pg',
            'sharp',
          ],
        }
      : {
          external: ['canvas'],
        },
})

export default defineConfig
