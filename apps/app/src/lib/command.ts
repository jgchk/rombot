import { InteractionResponseType } from 'discord-api-types/v10'
import type { APIInteraction, APIInteractionResponse } from 'discord-api-types/v10'

export type CommandHandler = <C extends APIInteraction>(
  command: C
) => APIInteractionResponse | Promise<APIInteractionResponse>

export const handlePing: CommandHandler = () => {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: 'Pong!',
    },
  }
}
