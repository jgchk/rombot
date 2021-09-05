import { User } from 'discord.js'
import { either, option, task, taskEither, taskOption } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import getDatabase from '../database'
import { DiscordUser } from '../database/schemas/discord-user'
import { RymAccount } from '../database/schemas/rym-account'
import {
  MissingDataError,
  UsernameDoesntExistError,
  UsernameNotFoundError,
} from '../errors'
import { getRymAccountInfo } from './rym-account'

const getDiscordUser =
  (user: User): taskOption.TaskOption<DiscordUser> =>
  async () => {
    const database = await getDatabase()()
    return option.fromNullable(await database.getDiscordUser(user.id))
  }

export const getUsernameForUser = (
  user: User
): taskEither.TaskEither<UsernameNotFoundError, string> =>
  pipe(
    getDiscordUser(user),
    taskOption.chain((discordUser) =>
      taskOption.fromNullable(discordUser.rymUsername)
    ),
    taskEither.fromTaskOption(() => new UsernameNotFoundError(user))
  )

export const setUsernameForUser = (
  user: User,
  username: string
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError,
  DiscordUser
> =>
  pipe(
    getRymAccountFromUsername(username),
    taskEither.chain((rymAccount) =>
      taskEither.fromTask(
        pipe(
          getDatabase(),
          task.chain((database) =>
            database.setDiscordUser({
              discordId: user.id,
              rymUsername: rymAccount.username,
            })
          )
        )
      )
    )
  )

const getRymAccountFromUsername = (
  username: string
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError,
  RymAccount
> =>
  pipe(
    getDatabase(),
    task.chain((database) => database.getRymAccount(username)),
    task.chain(
      option.fold(
        () => fetchRymAccountFromUsername(username),
        (rymAccount) => task.of(either.right(rymAccount))
      )
    )
  )

const fetchRymAccountFromUsername = (
  username: string
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError,
  RymAccount
> =>
  pipe(
    getRymAccountInfo(username),
    taskEither.chain((rymAccount) =>
      taskEither.fromTask(
        pipe(
          getDatabase(),
          task.chain((database) => database.setRymAccount(rymAccount))
        )
      )
    )
  )
