import { error, json } from '@sveltejs/kit'
import { ApplicationCommandType } from 'discord-api-types/v10'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'

import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch, url }) => {
  const botToken = url.searchParams.get('bot-token')
  if (botToken !== env.BOT_TOKEN) {
    throw error(401, 'Unauthorized')
  }

  await createGlobalCommand({
    name: 'ping',
    type: ApplicationCommandType.ChatInput,
    description: 'Replies with Pong!',
    options: [],
  })

  return json({ status: 'ok' })

  async function createGlobalCommand(data: RESTPostAPIApplicationCommandsJSONBody) {
    const res = await fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${env.BOT_TOKEN}`,
      },
      body: JSON.stringify(data),
    })
    return res.json()
  }
}
