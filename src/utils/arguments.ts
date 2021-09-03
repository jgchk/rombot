import { User } from 'discord.js'
import { either, task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { UsernameNotFoundError } from '../errors'
import { getUsernameForUser } from '../services/account'
import { CommandMessage } from '../types'
import { ifDefined } from './functional'

// howdy
// ~code_gs howdy
// @LilR howdy

// export type ParsedArguments = {
//   reply: option.Option<User>
//   mentions: User[]
//   usernames: string[]
//   otherArguments: string
// }

// export const parseArguments = (message: CommandMessage): ParsedArguments => {
//   const reply = option.fromNullable(message.message.mentions.repliedUser)
//   const mentions = [...message.message.mentions.users.filter(user => !user.isR)]
// }

export const getUsername =
  (
    message: CommandMessage
  ): task.Task<{
    maybeUsername: either.Either<UsernameNotFoundError, string>
    source: 'mention' | 'text' | 'author'
  }> =>
  async () => {
    const mention: User | undefined = [
      ...message.message.mentions.users.values(),
    ][0]
    if (mention !== undefined) {
      const mentionUsername = await getUsernameForUser(mention)
      return {
        source: 'mention',
        maybeUsername:
          mentionUsername !== undefined
            ? either.right(mentionUsername)
            : either.left(new UsernameNotFoundError(mention)),
      }
    }

    const textUsername = pipe(
      message.arguments_.find((argument) => argument.startsWith('~')),
      ifDefined((text) => text.slice(1))
    )
    if (textUsername !== undefined)
      return { source: 'text', maybeUsername: either.right(textUsername) }

    const authorUsername = await getUsernameForUser(message.message.author)
    return {
      source: 'author',
      maybeUsername:
        authorUsername !== undefined
          ? either.right(authorUsername)
          : either.left(new UsernameNotFoundError(message.message.author)),
    }
  }
