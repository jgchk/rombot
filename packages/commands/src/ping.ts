import { InteractionResponseType } from 'discord'

import { cmd } from './types'

export const ping = cmd(
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  () => ({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content: 'Pong!' },
  })
)
