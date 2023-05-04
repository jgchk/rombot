import { error, json } from '@sveltejs/kit'
import type {
  RESTGetAPIApplicationCommandsResult,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationCommandsResult,
} from 'discord-api-types/v10'
import { fetcher } from 'utils/browser'
import type { Fetcher } from 'utils/browser'

import { commands, oldCommands } from '$lib/commands'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch: fetch_, url }) => {
  const botToken = url.searchParams.get('bot-token')
  if (botToken !== env.BOT_TOKEN) {
    throw error(401, 'Unauthorized')
  }

  const fetch = fetcher(fetch_)
  await Promise.all([
    ...commands.map((command) => createGlobalCommand(fetch)(command.data)),
    ...oldCommands.map((command) => deleteGlobalCommandByName(fetch)(command.data.name)),
  ])

  return json({ status: 'ok' })
}

const createGlobalCommand =
  (fetch: Fetcher) => async (data: RESTPostAPIApplicationCommandsJSONBody) => {
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

const deleteGlobalCommandByName = (fetch: Fetcher) => async (name: string) => {
  try {
    const commands = await getGlobalCommands(fetch)
    const command = commands.find((command) => command.name === name)
    if (!command) {
      console.error(`Failed to delete command, command not found: ${name}`)
      return
    }
    await deleteGlobalCommand(fetch)(command.id)
    console.log(`Deleted command: ${name}`)
  } catch (e) {
    console.error(`Failed to delete command: ${name}`, e)
  }
}

const getGlobalCommands = async (fetch: Fetcher) =>
  fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands`, {
    headers: {
      Authorization: `Bot ${env.BOT_TOKEN}`,
    },
  }).then((res) => res.json<RESTGetAPIApplicationCommandsResult>())

const deleteGlobalCommand = (fetch: Fetcher) => async (commandId: string) =>
  fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands/${commandId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bot ${env.BOT_TOKEN}`,
    },
  })
