import type { InferModel } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'

export type Account = InferModel<typeof accounts>
export type InsertAccount = InferModel<typeof accounts, 'insert'>
export const accounts = pgTable('accounts', {
  discordId: text('discord_id').primaryKey(),
  rymUsername: text('rym_username').notNull(),
})
