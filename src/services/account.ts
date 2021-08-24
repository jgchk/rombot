import { User } from 'discord.js'
import getDatabase from '../database'
import { Account } from '../database/schemas/account'

const getAccount = async (user: User): Promise<Account | undefined> => {
  const database = await getDatabase()
  return database.getAccount(user.id)
}

export const getUsernameForUser = async (
  user: User
): Promise<string | undefined> =>
  (await getAccount(user))?.username ?? undefined

export const setUsernameForUser = async (
  user: User,
  username: string
): Promise<Account> => {
  const database = await getDatabase()
  return database.setAccount({ discordId: user.id, username })
}
