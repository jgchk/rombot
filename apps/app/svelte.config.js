import node from '@sveltejs/adapter-node'
import adapter from '@sveltejs/adapter-vercel'
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    // adapter: adapter({ runtime: 'edge' }),
    adapter: node(),
  },
}

export default config
