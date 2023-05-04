import { InteractionResponseType } from 'discord-api-types/v10'

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
