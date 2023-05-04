import { error, json } from '@sveltejs/kit'
import type {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationCommandsResult,
} from 'discord-api-types/v10'

import { commands } from '$lib/commands'
import { env } from '$lib/env'
import { fetcher } from '$lib/fetch'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch, url }) => {
  const botToken = url.searchParams.get('bot-token')
  if (botToken !== env.BOT_TOKEN) {
    throw error(401, 'Unauthorized')
  }

  await Promise.all(commands.map(({ name, data }) => createGlobalCommand({ name, ...data })))

  return json({ status: 'ok' })

  async function createGlobalCommand(data: RESTPostAPIApplicationCommandsJSONBody) {
    const res = await fetcher(fetch)(
      `https://discord.com/api/v10/applications/${env.APP_ID}/commands`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    ).then((res) => res.json<RESTPostAPIApplicationCommandsResult>())
    console.log(`Registered command: ${res.name}`, res)
  }
}
