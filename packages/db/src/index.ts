import type { PoolConfig } from '@neondatabase/serverless'
import { Pool } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-serverless'

import type { InsertAccount } from './schema'
import { accounts } from './schema'
import type { UpdateData } from './utils'
import { hasUpdate, makeUpdate } from './utils'

export const getDatabase = (config: PoolConfig) => wrapDatabase(drizzle(new Pool(config)))

const wrapDatabase = (db: ReturnType<typeof drizzle>) => {
  const accounts_ = {
    insert: (data: InsertAccount) => db.insert(accounts).values(data).returning(),
    update: (discordId: string, data: UpdateData<InsertAccount>) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return accounts_.get(discordId)
      return db.update(accounts).set(update).where(eq(accounts.discordId, discordId)).returning()
    },
    setRymUsername: (discordId: string, rymUsername: string) =>
      db
        .insert(accounts)
        .values({ discordId, rymUsername })
        .onConflictDoUpdate({ target: accounts.discordId, set: { rymUsername } })
        .returning()
        .then((res) => res[0]),
    get: (discordId: string) => db.select().from(accounts).where(eq(accounts.discordId, discordId)),
  }

  return { accounts: accounts_ }
}
