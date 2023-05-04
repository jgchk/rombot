import { error, json } from '@sveltejs/kit'
import type {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationCommandsResult,
} from 'discord-api-types/v10'
import { fetcher } from 'utils/browser'

import { commands } from '$lib/commands'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch: fetch_, url }) => {
  const botToken = url.searchParams.get('bot-token')
  if (botToken !== env.BOT_TOKEN) {
    throw error(401, 'Unauthorized')
  }

  await Promise.all(commands.map((command) => createGlobalCommand(command.data)))

  const fetch = fetcher(fetch_)
  async function createGlobalCommand(data: RESTPostAPIApplicationCommandsJSONBody) {
    try {
      const res = await fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((res) => res.json<RESTPostAPIApplicationCommandsResult>())
      console.log(`Registered command: ${res.name}`, res)
    } catch (e) {
      console.error(`Failed to register command: ${data.name}`, e)
    }
  }

  return json({ status: 'ok' })
}
