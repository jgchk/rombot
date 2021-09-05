import { User } from 'discord.js'
import { array, either, option, taskEither } from 'fp-ts'
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
import { follow, getRymAccount, unfollow } from '../services/rym-account'
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
          follow(rymAccount.accountId),
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
    taskEither.chainW((currentUsername) => getRymAccount(currentUsername)),
    taskEither.chainW((rymAccount) => unfollow(rymAccount.accountId))
  )

const getInputUsername = (
  message: CommandMessage
): either.Either<UsageError, string> =>
  pipe(
    message.arguments_,
    array.head,
    either.fromOption(() => new UsageError())
  )

export default set
