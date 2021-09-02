import { Schema, model } from 'mongoose'

export type WhoKnows = {
  issueUrl: string
  usernames: string[]
}

export const whoKnowsSchema = new Schema<WhoKnows>({
  issueUrl: { type: String, required: true, index: true },
  usernames: { type: [String], required: true },
})

export const WhoKnowsModel = model<WhoKnows>('WhoKnows', whoKnowsSchema)
