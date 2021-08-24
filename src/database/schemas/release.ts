import { Schema, model } from 'mongoose'
import { Artist, artistSchema } from './artist'
import { Genre, genreSchema } from './genre'
import { PartialDate, partialDateSchema } from './partial-date'
import { Track, trackSchema } from './track'

export type Release = {
  url: string
  combinedUrl: string
  issueUrls: string[]
  id: string
  title: string
  artists: Artist[]
  artistDisplayName: string | null
  type: string | null
  releaseDate: PartialDate | null
  cover: string | null
  rymRating: number | null
  numberRymRatings: number | null
  overallRank: number | null
  overallRankUrl: string | null
  yearRank: number | null
  yearRankUrl: string | null
  primaryGenres: Genre[] | null
  secondaryGenres: Genre[] | null
  descriptors: string[] | null
  tracks: Track[] | null
}

export const releaseSchema = new Schema<Release>({
  url: { type: String, required: true, index: true },
  combinedUrl: { type: String, required: true },
  issueUrls: { type: [String], required: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  artists: { type: [artistSchema], required: true },
  artistDisplayName: String,
  type: String,
  releaseDate: partialDateSchema,
  cover: String,
  rymRating: Number,
  numberRymRatings: Number,
  overallRank: Number,
  overallRankUrl: String,
  yearRank: Number,
  yearRankUrl: String,
  primaryGenres: [genreSchema],
  secondaryGenres: [genreSchema],
  descriptors: [String],
  tracks: [trackSchema],
})

export const ReleaseModel = model<Release>('Release', releaseSchema)
