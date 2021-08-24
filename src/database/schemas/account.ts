import { Schema, model } from 'mongoose'

export type Account = {
  discordId: string
  username: string | null
}

export const accountSchema = new Schema<Account>({
  discordId: { type: String, required: true, index: true },
  username: String,
})

export const AccountModel = model<Account>('Account', accountSchema)
