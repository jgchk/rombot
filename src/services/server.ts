import { either } from 'fp-ts'
import getDatabase from '../database'
import { Server } from '../database/schemas/server'
import { NotInServerError, UsageError } from '../errors'

export const DEFAULT_PREFIX = '!rym'

export const getServerPrefix = async (
  serverId: string | null | undefined
): Promise<string> => {
  if (!serverId) return DEFAULT_PREFIX
  const database = await getDatabase()
  const server = await database.getServer(serverId)
  return server?.prefix ?? DEFAULT_PREFIX
}

export const setServerPrefix = async (
  serverId: string | null | undefined,
  prefix: string
): Promise<either.Either<NotInServerError | UsageError, Server>> => {
  if (!serverId) return either.left(new NotInServerError())
  if (prefix.length === 0) return either.left(new UsageError())

  const database = await getDatabase()
  const server = await database.setServer({ id: serverId, prefix })
  return either.right(server)
}
