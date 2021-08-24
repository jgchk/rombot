import { User } from 'discord.js'
import { Either, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { UsernameNotFoundError } from '../errors'
import { getUsernameForUser } from '../services/account'
import { CommandMessage } from '../types'
import { ifDefined } from './functional'

export const getUsername = async (
  message: CommandMessage
): Promise<{
  maybeUsername: Either<UsernameNotFoundError, string>
  source: 'mention' | 'text' | 'author'
}> => {
  const mention: User | undefined = [
    ...message.message.mentions.users.values(),
  ][0]
  if (mention !== undefined) {
    const mentionUsername = await getUsernameForUser(mention)
    return {
      source: 'mention',
      maybeUsername:
        mentionUsername !== undefined
          ? right(mentionUsername)
          : left(new UsernameNotFoundError(mention)),
    }
  }

  const textUsername = pipe(
    message.arguments_.find((argument) => argument.startsWith('~')),
    ifDefined((text) => text.slice(1))
  )
  if (textUsername !== undefined)
    return { source: 'text', maybeUsername: right(textUsername) }

  const authorUsername = await getUsernameForUser(message.message.author)
  return {
    source: 'author',
    maybeUsername:
      authorUsername !== undefined
        ? right(authorUsername)
        : left(new UsernameNotFoundError(message.message.author)),
  }
}
