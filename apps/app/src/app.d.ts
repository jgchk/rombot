// See https://kit.svelte.dev/docs/types#app
import type { RequestContext } from '@vercel/edge'

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    interface Platform {
      context: RequestContext
    }
  }
}

export {}
