import { Schema, model } from 'mongoose'
import { Artist, artistSchema } from './artist'
import { Release } from './release'

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

export const releaseToPartialRelease = (release: Release): PartialRelease => ({
  issueUrl: release.url,
  title: release.title,
  artists: release.artists,
  artistDisplayName: release.artistDisplayName,
  releaseYear: release.releaseDate?.year ?? null,
  coverThumbnail: release.cover,
})
