import { sveltekit } from '@sveltejs/kit/vite'

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  server: {
    port: process.env.DEV_PORT,
  },
  ssr: {
    external: ['@neondatabase/serverless'],
  },
}

export default config
