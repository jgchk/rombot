import { User } from 'discord.js'
import { array, either, option, string, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import {
  MissingDataError,
  UsageError,
  UsernameDoesntExistError,
  UsernameNotFoundError,
} from '../errors'
import {
  getUsernameForUser,
  setUsernameForUser,
} from '../services/discord-user'
import { followByAccountId, unfollowByUsername } from '../services/rym-account'
import { Command, CommandMessage } from '../types'

const set: Command = {
  name: 'set',
  description: 'set your rym username',
  usage: 'set USERNAME',
  examples: ['set ~sharifi'],
  execute: (message) => async () => {
    await unfollowCurrentUsername(message.message.author)()

    return pipe(
      taskEither.fromEither(getInputUsername(message)),
      taskEither.chainW((inputUsername) =>
        setUsernameForUser(message.message.author, inputUsername)
      ),
      taskEither.chainW(({ rymAccount }) =>
        pipe(
          followByAccountId(rymAccount.accountId),
          taskEither.map(() =>
            option.some(`Set username to ~${rymAccount.username}`)
          )
        )
      )
    )()
  },
}

const unfollowCurrentUsername = (
  user: User
): taskEither.TaskEither<
  UsernameNotFoundError | MissingDataError | UsernameDoesntExistError,
  true
> =>
  pipe(
    getUsernameForUser(user),
    taskEither.chainW((currentUsername) => unfollowByUsername(currentUsername))
  )

const getInputUsername = (
  message: CommandMessage
): either.Either<UsageError, string> =>
  pipe(
    message.arguments_,
    array.head,
    // remove leading ~ if present
    option.map(string.replace(/^~/, '')),
    either.fromOption(() => new UsageError())
  )

export default set
