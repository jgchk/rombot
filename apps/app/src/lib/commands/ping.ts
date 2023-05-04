import { ApplicationCommandType, InteractionResponseType } from 'discord-api-types/v10'

import type { Command } from './types'

export const ping: Command = {
  name: 'ping',
  data: {
    type: ApplicationCommandType.ChatInput,
    description: 'Replies with Pong!',
  },
  handler: () => ({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content: 'Pong!' },
  }),
}
