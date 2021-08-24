import { Schema, model } from 'mongoose'

export type Genre = {
  name: string
  url: string
}

export const genreSchema = new Schema<Genre>({
  name: { type: String, required: true },
  url: { type: String, required: true },
})

export const GenreModel = model<Genre>('Genre', genreSchema)
