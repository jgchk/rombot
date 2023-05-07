import { error, json } from '@sveltejs/kit'
import { Discord, InteractionResponseType, InteractionType } from 'discord'
import type { APIInteraction } from 'discord'
import { DEV } from 'esm-env'
import { sleep } from 'utils'
import { fetcher } from 'utils/browser'

import { commandMap } from '$lib/commands'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

const getDatabase = DEV
  ? import('db/node').then((res) => res.getNodeDatabase)
  : import('db/edge').then((res) => res.getEdgeDatabase)

export const POST: RequestHandler = async ({ request, fetch: fetch_, platform }) => {
  const fetch = fetcher(fetch_)
  const discord = Discord(fetch, env)

  const rawBody = await request.arrayBuffer()
  const isVerified = DEV || discord.verify(request, rawBody)
  if (!isVerified) throw error(401, 'Bad request signature')

  const message = JSON.parse(new TextDecoder().decode(rawBody)) as APIInteraction
  console.log('Received interaction', message)

  switch (message.type) {
    case InteractionType.Ping: {
      return json({ type: InteractionResponseType.Pong })
    }
    case InteractionType.ApplicationCommand: {
      const command = commandMap.get(message.data.name)

      if (command === undefined) {
        throw error(400, 'Bad request command')
      }

      const db = (await getDatabase)({ connectionString: env.DATABASE_URL })

      let responded = false
      const response = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        Promise.resolve(command.handler(message as any, { fetch, db })).then((res) => {
          if (responded) {
            if (res.type === InteractionResponseType.ChannelMessageWithSource) {
              console.log('Editing response...')
              if (platform) {
                platform.waitUntil(
                  discord
                    .editInteractionResponse(message.token, res.data)
                    .then(() => console.log('Response edited!', res))
                )
              } else {
                console.error('Platform is unavailable')
              }
            } else {
              console.log('Not editing response, response is not a channel message')
            }
          }

          return res
        }),
        sleep(2500).then(() => ({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: 'Loading...',
          },
        })),
      ])
      responded = true

      console.log('Responding with', response)

      return json(response)
    }
    default: {
      throw error(400, 'Bad request type')
    }
  }
}
