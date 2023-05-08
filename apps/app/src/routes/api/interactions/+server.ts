import { error, json } from '@sveltejs/kit'
import { commandMap } from 'commands'
import type { CommandResponse } from 'commands/src/types'
import { Discord, InteractionResponseType, InteractionType, MessageFlags } from 'discord'
import type {
  APIInteraction,
  APIInteractionResponse,
  APIInteractionResponseDeferredChannelMessageWithSource,
} from 'discord'
import { verifyKey } from 'discord-interactions'
import { DEV } from 'esm-env'
import { getRedis } from 'redis'
import { sleep } from 'utils'
import { fetcher } from 'utils/browser'

import { env } from '$lib/env'

import type { RequestHandler } from './$types'

const getDatabase = DEV
  ? import('db/node').then((res) => res.getNodeDatabase)
  : import('db/edge').then((res) => res.getEdgeDatabase)

let DATABASE_URL = env.DATABASE_URL
if (DEV && !DATABASE_URL.endsWith('?sslmode=require')) {
  DATABASE_URL += '?sslmode=require'
}

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
      const db = (await getDatabase)({ connectionString: DATABASE_URL })
      const redis = getRedis({ url: env.REDIS_URL, token: env.REDIS_TOKEN })

      let responded = false

      const commandRunnerPromise: Promise<APIInteractionResponse> = Promise.resolve(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        command.handler(message as any, { fetch, db, redis })
      ).then(async (res) => {
        let response: APIInteractionResponse = {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            ...res,
            content: res.content ?? undefined,
            embeds: res.embeds ?? undefined,
            allowed_mentions: res.allowed_mentions ?? undefined,
            components: res.components ?? undefined,
          },
        }
        if (responded) {
          await handleEditMessage(message.token, res, discord)
        } else if (res.files?.length) {
          await handleEditMessage(message.token, res, discord)
          response = getLoadingMessage(command.private)
        }
        return response
      })
      platform?.context.waitUntil(commandRunnerPromise)

      const loadingPromise = sleep(2500).then(() => getLoadingMessage(command.private))

      const response = await Promise.race([commandRunnerPromise, loadingPromise])
      responded = true

      console.log('Sending response:', response)
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

const getLoadingMessage = (
  isPrivate?: boolean
): APIInteractionResponseDeferredChannelMessageWithSource => ({
  type: InteractionResponseType.DeferredChannelMessageWithSource,
  data: {
    flags: isPrivate ? MessageFlags.Ephemeral : undefined,
  },
})

const handleEditMessage = async (messageToken: string, res: CommandResponse, discord: Discord) => {
  console.log('Editing response with', res)
  const { files, ...data } = res
  await discord
    .editInteractionResponse(messageToken, data, files)
    .then(() => console.log('Response edited!', res))
    .catch((err) => console.error('Failed to upload files', err))
}
