import { Message, MessagePayload, ReplyMessageOptions } from 'discord.js'
import { Either } from 'fp-ts/Either'
import { AppError } from './errors'

export type Command = {
  name: string
  description: string
  aliases?: string[]
  usage: string
  examples: string[]
  execute: (message: CommandMessage) => Promise<CommandOutput> | CommandOutput
}

export type CommandOutput =
  | Either<AppError, string | MessagePayload | ReplyMessageOptions>
  | undefined

export type CommandMessage = {
  message: Message
  command: Command
  name: string
  arguments_: string[]
}
