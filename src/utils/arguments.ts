import { User } from 'discord.js'
import { array, either, option, string, task, taskEither } from 'fp-ts'
import { dropLeft } from 'fp-ts-std/String'
import { pipe } from 'fp-ts/function'
import { UsernameNotFoundError } from '../errors'
import { getUsernameForUser } from '../services/discord-user'
import { CommandMessage } from '../types'
import { ifDefined } from './functional'

// howdy
// ~code_gs howdy
// @LilR howdy

export type ParsedArguments = {
  author: User
  reply: option.Option<User>
  mentions: User[]
  usernames: string[]
  otherArguments: string[]
}

export const parseArguments = (message: CommandMessage): ParsedArguments => {
  const author = message.message.author
  const reply = option.fromNullable(message.message.mentions.repliedUser)
  const mentions = [...message.message.mentions.users.values()]
  const usernames = pipe(
    message.arguments_,
    array.filter(string.startsWith('~')),
    array.map(dropLeft(1))
  )
  const otherArguments = message.arguments_.filter(
    (argument) =>
      !mentions.map((mention) => `<@!${mention.id}>`).includes(argument) &&
      !usernames.map((username) => `~${username}`).includes(argument)
  )
  return {
    author,
    reply,
    mentions,
    usernames,
    otherArguments,
  }
}

type Query = { _tag: 'query'; query: string }
type Username = { _tag: 'username'; username: string }

export const isQuery = (t: Query | Username): t is Query => t._tag === 'query'
export const isUsername = (t: Query | Username): t is Username =>
  t._tag === 'username'

export const getUsernameOrQuery = (
  parsedArguments: ParsedArguments
): taskEither.TaskEither<UsernameNotFoundError, Query | Username> => {
  const firstUsername = array.head(parsedArguments.usernames)
  if (option.isSome(firstUsername))
    return taskEither.right({ _tag: 'username', username: firstUsername.value })

  const firstMention = array.head(parsedArguments.mentions)
  if (option.isSome(firstMention))
    return pipe(
      getUsernameForUser(firstMention.value),
      taskEither.map((username) => ({ _tag: 'username', username }))
    )

  if (array.isNonEmpty(parsedArguments.otherArguments))
    return taskEither.right({
      _tag: 'query',
      query: parsedArguments.otherArguments.join(' '),
    })

  return pipe(
    getUsernameForUser(parsedArguments.author),
    taskEither.map((username) => ({ _tag: 'username', username }))
  )
}

export type UsernameAndQuery = {
  maybeQuery: option.Option<string>
  maybeUsername: either.Either<UsernameNotFoundError, string>
}
export const getUsernameAndQuery = (
  parsedArguments: ParsedArguments
): task.Task<UsernameAndQuery> => {
  const maybeQuery = array.isNonEmpty(parsedArguments.otherArguments)
    ? option.some(parsedArguments.otherArguments.join(' '))
    : option.none

  const firstUsername = array.head(parsedArguments.usernames)
  if (option.isSome(firstUsername))
    return task.of({
      maybeQuery,
      maybeUsername: either.right(firstUsername.value),
    })

  const firstMention = array.head(parsedArguments.mentions)
  if (option.isSome(firstMention))
    return pipe(
      getUsernameForUser(firstMention.value),
      task.map((maybeUsername) => ({ maybeQuery, maybeUsername }))
    )

  return pipe(
    getUsernameForUser(parsedArguments.author),
    task.map((maybeUsername) => ({ maybeQuery, maybeUsername }))
  )
}

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
      const mentionUsername = await getUsernameForUser(mention)()
      return {
        source: 'mention',
        maybeUsername: either.isRight(mentionUsername)
          ? either.right(mentionUsername.right)
          : either.left(new UsernameNotFoundError(mention)),
      }
    }

    const textUsername = pipe(
      message.arguments_.find((argument) => argument.startsWith('~')),
      ifDefined((text) => text.slice(1))
    )
    if (textUsername !== undefined)
      return { source: 'text', maybeUsername: either.right(textUsername) }

    const authorUsername = await getUsernameForUser(message.message.author)()
    return {
      source: 'author',
      maybeUsername: either.isRight(authorUsername)
        ? either.right(authorUsername.right)
        : either.left(new UsernameNotFoundError(message.message.author)),
    }
  }
