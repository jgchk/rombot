import { error, json } from '@sveltejs/kit'
import { Discord, InteractionResponseType, InteractionType, MessageFlags } from 'discord'
import type { APIInteraction } from 'discord'
import { verifyKey } from 'discord-interactions'
import { DEV } from 'esm-env'
import { getRedis } from 'redis'
import { sleep } from 'utils'
import { fetcher } from 'utils/browser'

import { commandMap } from '$lib/commands'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

const getDatabase = DEV
  ? import('db/node').then((res) => res.getNodeDatabase)
  : import('db/edge').then((res) => res.getEdgeDatabase)

export const POST: RequestHandler = async ({ request, fetch: fetch_, platform }) => {
  const rawBody = await request.arrayBuffer()
  const isVerified = DEV || verify(request, rawBody)
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
      const discord = Discord(fetch, env)
      const db = (await getDatabase)({ connectionString: env.DATABASE_URL })
      const redis = getRedis({ url: env.REDIS_URL, token: env.REDIS_TOKEN })

      let responded = false
      const response = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        Promise.resolve(command.handler(message as any, { fetch, db, redis })).then((res) => {
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
        sleep(DEV ? 999999 : 2500).then(() => ({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: 'Loading...',
            flags: MessageFlags.Loading,
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

const verify = (request: Request, rawBody: ArrayBuffer) => {
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')

  if (signature === null || timestamp === null) {
    return false
  }

  return verifyKey(rawBody, signature, timestamp, env.PUBLIC_KEY)
}
