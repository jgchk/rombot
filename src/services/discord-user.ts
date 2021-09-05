import { User } from 'discord.js'
import { option, task, taskEither, taskOption } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import getDatabase from '../database'
import { DiscordUser } from '../database/schemas/discord-user'
import { UsernameNotFoundError } from '../errors'

const getAccount =
  (user: User): taskOption.TaskOption<DiscordUser> =>
  async () => {
    const database = await getDatabase()()
    return option.fromNullable(await database.getDiscordUser(user.id))
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
  (user: User, username: string): task.Task<DiscordUser> =>
  async () => {
    const database = await getDatabase()()
    return database.setDiscordUser({ discordId: user.id, username })
  }
