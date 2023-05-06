import { dev } from '$app/environment'
import type {
  RESTPatchAPIInteractionOriginalResponseJSONBody,
  RESTPatchAPIInteractionOriginalResponseResult,
} from 'discord-api-types/v10'
import { verifyKey } from 'discord-interactions'
import type { Fetcher } from 'utils/browser'

import { env } from './env'

export const verify = (request: Request, rawBody: ArrayBuffer) => {
  if (dev) return true

  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')

  if (signature === null || timestamp === null) {
    return false
  }

  return verifyKey(rawBody, signature, timestamp, env.PUBLIC_KEY)
}

export const editInteractionResponse =
  (fetch: Fetcher) =>
  (interactionToken: string, response: RESTPatchAPIInteractionOriginalResponseJSONBody) =>
    fetch(
      `https://discord.com/api/v10/webhooks/${env.APP_ID}/${interactionToken}/messages/@original`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      }
    ).then((res) => res.json<RESTPatchAPIInteractionOriginalResponseResult>())
