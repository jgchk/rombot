import { User } from 'discord.js'
import { option, task, taskEither, taskOption } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import getDatabase from '../database'
import { Account } from '../database/schemas/account'
import { UsernameNotFoundError } from '../errors'

const getAccount =
  (user: User): taskOption.TaskOption<Account> =>
  async () => {
    const database = await getDatabase()()
    return option.fromNullable(await database.getAccount(user.id))
  }

export const getUsernameForUser = (
  user: User
): taskEither.TaskEither<UsernameNotFoundError, string> =>
  pipe(
    getAccount(user),
    taskOption.chain((account) => taskOption.fromNullable(account.username)),
    taskEither.fromTaskOption(() => new UsernameNotFoundError(user))
  )

export const setUsernameForUser =
  (user: User, username: string): task.Task<Account> =>
  async () => {
    const database = await getDatabase()()
    return database.setAccount({ discordId: user.id, username })
  }
