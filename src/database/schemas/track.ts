import { Schema, model } from 'mongoose'

export type Track = {
  number: string
  title: string
  duration: string | null
}

export const trackSchema = new Schema<Track>({
  number: { type: String, required: true },
  title: { type: String, required: true },
  duration: String,
})

export const TrackModel = model<Track>('Track', trackSchema)
