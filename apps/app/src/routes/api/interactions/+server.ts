import { error, json } from '@sveltejs/kit'
import { InteractionResponseType, InteractionType } from 'discord-api-types/v10'
import type { APIInteraction } from 'discord-api-types/v10'
import { sleep } from 'utils'
import { fetcher } from 'utils/browser'

import { commandMap } from '$lib/commands'
import { editInteractionResponse, verify } from '$lib/discord'

import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, fetch: fetch_ }) => {
  const rawBody = await request.arrayBuffer()
  const isVerified = verify(request, rawBody)
  if (!isVerified) throw error(401, 'Bad request signature')

  const message = JSON.parse(new TextDecoder().decode(rawBody)) as APIInteraction
  console.log('Received interaction', message)

  message.token

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

      let returnedEarly = false
      const response = await Promise.race([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        Promise.resolve(command.handler(message as any, { fetch })).then(async (res) => {
          if (returnedEarly) {
            console.log('Returned early')
            if (res.type === InteractionResponseType.ChannelMessageWithSource) {
              console.log('Editing response...')
              await editInteractionResponse(fetch)(message.token, res.data)
            } else {
              console.log('Not editing response')
            }
          }

          return res
        }),

        sleep(2500).then(() => {
          returnedEarly = true
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
