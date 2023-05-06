import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import type { Actions } from './$types'

const ChartEntry = z.object({
  imageUrl: z.string().optional(),
  title: z.string(),
  artist: z.string(),
  rating: z.number().min(1).max(10).optional(),
})

const Chart = z.object({
  entries: ChartEntry.array().min(1).max(25),
  rows: z.number().min(1).max(25).optional(),
  cols: z.number().min(1).max(25).optional(),
  coverSize: z.number().min(100).max(800).optional(),
})

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
    console.log('POST', form)

    // Convenient validation check:
    if (!form.valid) {
      // Again, always return { form } and things will just work.
      return fail(400, { form })
    }

    return { form }
  },
}
