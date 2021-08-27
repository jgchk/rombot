import { Either, left, right } from 'fp-ts/Either'
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
): Promise<Either<NotInServerError | UsageError, Server>> => {
  if (!serverId) return left(new NotInServerError())
  if (prefix.length === 0) return left(new UsageError())

  const database = await getDatabase()
  const server = await database.setServer({ id: serverId, prefix })
  return right(server)
}
