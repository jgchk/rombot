import { Schema, model } from 'mongoose'

export type DiscordUser = {
  discordId: string
  rymUsername: string | null
}

export const discordUserSchema = new Schema<DiscordUser>({
  discordId: { type: String, required: true, index: true },
  rymUsername: String,
})

export const DiscordUserModel = model<DiscordUser>(
  'DiscordUser',
  discordUserSchema
)
