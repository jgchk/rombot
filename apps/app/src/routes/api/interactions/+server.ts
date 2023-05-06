import { error, json } from '@sveltejs/kit'
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10'
import type { APIInteraction } from 'discord-api-types/v10'
import { DEV } from 'esm-env'
import { sleep } from 'utils'
import { fetcher } from 'utils/browser'

import { commandMap } from '$lib/commands'
import { verify } from '$lib/discord'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

const getDatabase = DEV
  ? import('db/node').then((res) => res.getNodeDatabase)
  : import('db/edge').then((res) => res.getEdgeDatabase)

export const POST: RequestHandler = async ({ request, fetch: fetch_ }) => {
  const rawBody = await request.arrayBuffer()
  const isVerified = verify(request, rawBody)
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

      const fetch = fetcher(fetch_)

      if (command.runtime === 'node') {
        console.log('Running with Node...')

        await fetch('/api/interactions/node', {
          method: 'POST',
          headers: request.headers,
          body: rawBody,
        })

        return json({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: 'Loading...',
          },
        })
      } else {
        console.log('Running with Edge...')
      }

      const db = (await getDatabase)({ connectionString: env.DATABASE_URL })

      let responded = false
      const response = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        command.handler(message as any, { fetch, db }),
        sleep(2500).then(() => {
          if (!responded) {
            void fetch('/api/interactions/node', {
              method: 'POST',
              headers: request.headers,
              body: rawBody,
            })
          }

          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: 'Loading...',
            },
          }
        }),
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
