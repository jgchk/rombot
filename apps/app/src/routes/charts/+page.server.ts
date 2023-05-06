import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'

import { Chart } from '$lib/charts'

import type { Actions } from './$types'

const schema = Chart

export const load = async () => {
  // Server API:
  const form = await superValidate({ entries: [{ title: '', artist: '' }] }, schema)

  // Always return { form } in load and form actions.
  return { form }
}

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, schema)

    // Convenient validation check:
    if (!form.valid) {
      // Again, always return { form } and things will just work.
      return fail(400, { form })
    }

    return { form }
  },
}
