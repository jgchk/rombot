import { Message, MessagePayload, ReplyMessageOptions } from 'discord.js'
import { option, taskEither } from 'fp-ts'
import { AppError } from './errors'

export type Command = {
  name: string
  description: string
  aliases?: string[]
  usage: string
  examples: string[]
  execute: (
    message: CommandMessage
  ) => taskEither.TaskEither<
    AppError,
    option.Option<string | MessagePayload | ReplyMessageOptions>
  >
}

export type CommandMessage = {
  message: Message
  command: Command
  name: string
  arguments_: string[]
}
