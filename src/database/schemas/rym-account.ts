import { Schema, model } from 'mongoose'

export type RymAccount = {
  username: string
  accountId: string
}

export const rymAccountSchema = new Schema<RymAccount>({
  username: { type: String, required: true, index: true },
  accountId: { type: String, required: true },
})

export const RymAccountModel = model<RymAccount>('RymAccount', rymAccountSchema)
