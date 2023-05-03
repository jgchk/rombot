import type { InferModel } from 'drizzle-orm'
import { pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core'

export type DiscordAccount = InferModel<typeof discordAccounts>
export type InsertDiscordAccount = InferModel<typeof discordAccounts, 'insert'>
export const discordAccounts = pgTable(
  'discord-accounts',
  {
    id: serial('id').primaryKey(),
    discordId: text('discord_id').notNull(),
  },
  (discordAccounts) => ({
    discordIdIndex: uniqueIndex('discord_id_idx').on(discordAccounts.discordId),
  })
)
