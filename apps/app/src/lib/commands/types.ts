import type {
  APIApplicationCommandInteraction,
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  APIMessageApplicationCommandInteraction,
  APIUserApplicationCommandInteraction,
  ApplicationCommandType,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10'
import type { Fetch } from 'utils/browser'

export type Command<D extends RESTPostAPIApplicationCommandsJSONBody> = {
  data: D
  handler: CommandMessageHandler<D>
}

export type CommandMessageHandler<D extends RESTPostAPIApplicationCommandsJSONBody> =
  CommandHandler<CommandMessage<D['type']>>

export type CommandHandler<C extends APIApplicationCommandInteraction> = (
  command: C,
  context: CommandContext
) => APIInteractionResponse | Promise<APIInteractionResponse>

export type CommandContext = {
  fetch: Fetch
}

export type CommandMessage<T extends ApplicationCommandType | undefined> =
  T extends ApplicationCommandType.ChatInput
    ? APIChatInputApplicationCommandInteraction
    : T extends ApplicationCommandType.User
    ? APIUserApplicationCommandInteraction
    : T extends ApplicationCommandType.Message
    ? APIMessageApplicationCommandInteraction
    : [undefined] extends [T]
    ? APIChatInputApplicationCommandInteraction
    : never

export const cmd = <D extends RESTPostAPIApplicationCommandsJSONBody>(
  data: D,
  handler: CommandMessageHandler<D>
): Command<D> => ({
  data,
  handler,
})
