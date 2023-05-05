import { dev } from '$app/environment'
import { verifyKey } from 'discord-interactions'

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
