import { error, json } from '@sveltejs/kit'
import { Discord } from 'discord'
import { fetcher } from 'utils/browser'

import { commands, oldCommands } from '$lib/commands'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch: fetch_, url }) => {
  const botToken = url.searchParams.get('bot-token')
  if (botToken !== env.BOT_TOKEN) {
    throw error(401, 'Unauthorized')
  }

  const fetch = fetcher(fetch_)
  const discord = Discord(fetch, env)

  await Promise.all([
    ...commands.map(async (command) => {
      try {
        const res = await discord.createGlobalCommand(command.data)
        console.log(`Registered command: ${res.name}`, res)
      } catch (e) {
        console.error(`Failed to register command: ${command.data.name}`, e)
      }
    }),
    ...oldCommands.map(async (command) => {
      try {
        await discord.deleteGlobalCommandByName(command.data.name)
        console.log(`Deleted command: ${command.data.name}`)
      } catch (e) {
        console.error(`Failed to delete command: ${command.data.name}`, e)
      }
    }),
  ])

  return json({ status: 'ok' })
}
