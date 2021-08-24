import { Schema, model } from 'mongoose'

export type Artist = {
  name: string
  url: string
}

export const artistSchema = new Schema<Artist>({
  name: { type: String, required: true },
  url: { type: String, required: true },
})

export const ArtistModel = model<Artist>('Artist', artistSchema)
