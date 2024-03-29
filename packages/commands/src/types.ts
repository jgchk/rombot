import type { Database } from 'db'
import type {
  APIApplicationCommandInteraction,
  APIChatInputApplicationCommandInteraction,
  APIMessageApplicationCommandInteraction,
  APIUserApplicationCommandInteraction,
  ApplicationCommandType,
  RESTPatchAPIInteractionOriginalResponseJSONBody,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord'
import type { Redis } from 'redis'
import type { Fetcher } from 'utils/browser'

export type Command<
  D extends RESTPostAPIApplicationCommandsJSONBody = RESTPostAPIApplicationCommandsJSONBody
> = {
  data: D
  private?: boolean
  handler: CommandMessageHandler<D>
}

export type CommandMessageHandler<D extends RESTPostAPIApplicationCommandsJSONBody> =
  CommandHandler<CommandMessage<D['type']>>

export type CommandHandler<C extends APIApplicationCommandInteraction> = (
  command: C,
  context: CommandContext
) => CommandResponse | Promise<CommandResponse>

export type CommandResponse = RESTPatchAPIInteractionOriginalResponseJSONBody & {
  files?: File[]
  private?: boolean
}

export type CommandContext = {
  fetch: Fetcher
  db: Database
  redis: Redis
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
  data: D & { private?: boolean },
  handler: CommandMessageHandler<D>
): Command<D> => ({
  data,
  private: data.private,
  handler,
})
