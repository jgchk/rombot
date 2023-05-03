import { dev } from '$app/environment'
import { error, json } from '@sveltejs/kit'
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10'
import type { APIInteraction } from 'discord-api-types/v10'
import { verifyKey } from 'discord-interactions'

import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  const isVerified = await verify(request)
  if (!isVerified) throw error(401, 'Bad request signature')

  const message = (await request.json()) as APIInteraction

  switch (message.type) {
    case InteractionType.Ping: {
      return json({ type: InteractionResponseType.Pong })
    }
    case InteractionType.ApplicationCommand: {
      // TODO
      throw error(501, 'Not implemented')
    }
    default: {
      throw error(400, 'Bad request type')
    }
  }
}

const verify = async (request: Request) => {
  if (dev) return true

  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')
  const rawBody = await request.arrayBuffer()

  if (signature === null || timestamp === null) {
    return false
  }

  return verifyKey(rawBody, signature, timestamp, env.PUBLIC_KEY)
}
