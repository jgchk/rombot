import { error, json } from '@sveltejs/kit'
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10'
import type { APIInteraction } from 'discord-api-types/v10'
import { sleep } from 'utils'
import { fetcher } from 'utils/browser'

import { commandMap } from '$lib/commands'
import { verify } from '$lib/discord'

import type { RequestHandler } from './$types'

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

      const response = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        command.handler(message as any, { fetch }),
        sleep(2500).then(async () => {
          await fetch('/api/interactions/node', {
            method: 'POST',
            headers: request.headers,
            body: rawBody,
          })

          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: 'Loading...',
            },
          }
        }),
      ])

      console.log('Responding with', response)

      return json(response)
    }
    default: {
      throw error(400, 'Bad request type')
    }
  }
}
