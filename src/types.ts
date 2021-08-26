import { Message, MessagePayload, ReplyMessageOptions } from 'discord.js'
import { Either } from 'fp-ts/Either'
import { AppError } from './errors'

export type Command = {
  name: string
  description: string
  aliases?: string[]
  usage: string
  examples: string[]
  execute: (
    message: CommandMessage
  ) => Promise<Either<AppError, string | MessagePayload | ReplyMessageOptions>>
}

export type CommandMessage = {
  message: Message
  command: Command
  name: string
  arguments_: string[]
}
