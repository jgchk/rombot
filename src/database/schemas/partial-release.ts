import { Schema, model } from 'mongoose'
import { Artist, artistSchema } from './artist'

export type PartialRelease = {
  issueUrl: string
  title: string
  artists: Artist[]
  artistDisplayName: string | null
  releaseYear: number | null
  coverThumbnail: string | null
}

export const partialReleaseSchema = new Schema<PartialRelease>({
  issueUrl: { type: String, required: true, index: true },
  title: { type: String, required: true },
  artists: { type: [artistSchema], required: true },
  artistDisplayName: String,
  releaseYear: Number,
  coverThumbnail: String,
})

export const PartialReleaseModel = model<PartialRelease>(
  'PartialRelease',
  partialReleaseSchema
)
