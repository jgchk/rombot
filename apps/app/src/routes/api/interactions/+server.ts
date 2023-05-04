import { dev } from '$app/environment'
import { error, json } from '@sveltejs/kit'
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10'
import type { APIInteraction } from 'discord-api-types/v10'
import { verifyKey } from 'discord-interactions'

import { handlePing } from '$lib/command'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
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
      switch (message.data.name) {
        case 'ping': {
          const result = await handlePing(message)
          console.log('Responding with', result)
          return json(result)
        }
        default: {
          throw error(400, 'Bad request command')
        }
      }
    }
    default: {
      throw error(400, 'Bad request type')
    }
  }
}

const verify = (request: Request, rawBody: ArrayBuffer) => {
  if (dev) return true

  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')

  if (signature === null || timestamp === null) {
    return false
  }

  return verifyKey(rawBody, signature, timestamp, env.PUBLIC_KEY)
}
