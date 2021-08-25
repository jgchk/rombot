import { Schema, model } from 'mongoose'

export type Server = {
  id: string
  prefix: string | null
}

export const serverSchema = new Schema<Server>({
  id: { type: String, required: true },
  prefix: String,
})

export const ServerModel = model<Server>('Server', serverSchema)
