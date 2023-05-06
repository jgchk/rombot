import { error, json } from '@sveltejs/kit'
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10'
import type { APIInteraction } from 'discord-api-types/v10'
import { fetcher } from 'utils/browser'

import { commandMap } from '$lib/commands'
import { verify } from '$lib/discord'

import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, fetch }) => {
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const result = await command.handler(message as any, { fetch: fetcher(fetch) })
      console.log('Responding with', result)
      return json(result)
    }
    default: {
      throw error(400, 'Bad request type')
    }
  }
}
