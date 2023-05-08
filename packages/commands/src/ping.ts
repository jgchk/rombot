import { cmd } from './types'

export const ping = cmd(
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  () => ({
    content: 'Pong!',
  })
)
