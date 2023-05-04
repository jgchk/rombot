import type {
  APIInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10'
import type { DistributiveOmit } from 'utils'

export type Command = {
  name: string
  data: DistributiveOmit<RESTPostAPIApplicationCommandsJSONBody, 'name'>
  handler: CommandHandler
}

export type CommandHandler = <C extends APIInteraction>(
  command: C
) => APIInteractionResponse | Promise<APIInteractionResponse>
