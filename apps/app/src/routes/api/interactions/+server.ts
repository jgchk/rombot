import { error, json } from '@sveltejs/kit'
import { commandMap } from 'commands'
import type { CommandResponse } from 'commands/src/types'
import { Discord, InteractionResponseType, InteractionType, MessageFlags } from 'discord'
import type { APIInteraction, APIInteractionResponse } from 'discord'
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

      const commandRunnerPromise = Promise.resolve(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        command.handler(message as any, { fetch, db, redis })
      ).then(async ({ files, ...res }) => {
        if (responded) {
          if (res.type === InteractionResponseType.ChannelMessageWithSource) {
            console.log('Editing response with', res)
            await discord
              .editInteractionResponse(
                message.token,
                {
                  ...res.data,
                  embeds: res.data.embeds ?? null,
                  content: res.data.content ?? null,
                },
                files
              )
              .then(() => console.log('Response edited!', res))
              .catch((err) => console.error('Failed to upload files (1)', err))
          } else {
            console.log('Not editing response, response is not a channel message')
          }
        }

        return { ...res, files }
      })
      platform?.context.waitUntil(commandRunnerPromise)

      const loadingPromise = sleep(DEV ? 999999 : 2500).then(() => loadingMessage)

      let response: CommandResponse = await Promise.race([commandRunnerPromise, loadingPromise])
      if (response.files?.length) {
        // if we have files to upload, we have to edit the response.
        // just send the loading message for now and upload via editInteractionResponse

        console.log('Uploading files...', response)
        if (response.type === InteractionResponseType.ChannelMessageWithSource) {
          const editResponse = discord
            .editInteractionResponse(message.token, response.data, response.files)
            .then((res) => console.log('Files uploaded!', res))
            .catch((err) => console.error('Failed to upload files (2)', err))
          platform?.context.waitUntil(editResponse)
        } else {
          console.log('Failed to upload files: response is not a channel message')
        }

        response = loadingMessage
      }
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

const loadingMessage: APIInteractionResponse = {
  type: InteractionResponseType.DeferredChannelMessageWithSource,
  data: {
    flags: MessageFlags.Loading,
  },
  // data: {
  //   embeds: [
  //     {
  //       author: {
  //         name: 'Loading...',
  //         icon_url:
  //           'https://cdn.discordapp.com/attachments/350830712150294528/1104876768852201472/loading.gif',
  //       },
  //       description: ' ',
  //       color: 0x195aff,
  //     },
  //   ],
  //   flags: MessageFlags.Loading,
  // },
}
