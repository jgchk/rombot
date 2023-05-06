import { eq } from 'drizzle-orm'
import type { drizzle } from 'drizzle-orm/neon-serverless'

import type { InsertAccount } from './schema'
import { accounts } from './schema'
import type { UpdateData } from './utils'
import { getFirstOrThrow, hasUpdate, makeUpdate } from './utils'

export type Database = ReturnType<typeof wrapDatabase>
export const wrapDatabase = (db: ReturnType<typeof drizzle>) => {
  const accounts_ = {
    insert: (data: InsertAccount) =>
      db
        .insert(accounts)
        .values(data)
        .returning()
        .then((res) => getFirstOrThrow(res, 'Could not insert account')),
    update: async (discordId: string, data: UpdateData<InsertAccount>) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return accounts_.get(discordId)
      const res = await db
        .update(accounts)
        .set(update)
        .where(eq(accounts.discordId, discordId))
        .returning()
      return getFirstOrThrow(res, `No account found for discordId ${discordId}`)
    },
    setRymUsername: (discordId: string, rymUsername: string) =>
      db
        .insert(accounts)
        .values({ discordId, rymUsername })
        .onConflictDoUpdate({ target: accounts.discordId, set: { rymUsername } })
        .returning()
        .then((res) => getFirstOrThrow(res, `No account found for discordId ${discordId}`)),
    get: (discordId: string) =>
      db
        .select()
        .from(accounts)
        .where(eq(accounts.discordId, discordId))
        .then((res) => getFirstOrThrow(res, `No account found for discordId ${discordId}`)),
    find: (discordId: string) =>
      db
        .select()
        .from(accounts)
        .where(eq(accounts.discordId, discordId))
        .then((res) => res.at(0)),
  }

  return { accounts: accounts_ }
}
