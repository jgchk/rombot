import { PopulatedDoc, Schema, model } from 'mongoose'
import { RymAccount } from './rym-account'

export type DiscordUser = {
  discordId: string
  rymAccount: PopulatedDoc<RymAccount & Document> | null
}

export const discordUserSchema = new Schema<DiscordUser>({
  discordId: { type: String, required: true, index: true },
  rymAccount: { type: 'ObjectId', ref: 'RymAccount' },
})

export const DiscordUserModel = model<DiscordUser>(
  'DiscordUser',
  discordUserSchema
)
