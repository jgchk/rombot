import { Schema, model } from 'mongoose'
import { FullDate, fullDateSchema } from './full-date'
import { Tag, tagSchema } from './tag'

export type Rating = {
  username: string
  issueUrl: string
  date: FullDate
  rating: number | null
  ownership: string | null
  tags: Tag[] | null
}

export const ratingSchema = new Schema<Rating>({
  username: { type: String, required: true, index: true },
  issueUrl: { type: String, required: true, index: true },
  date: { type: fullDateSchema, required: true },
  rating: Number,
  ownership: String,
  tags: [tagSchema],
})

export const RatingModel = model<Rating>('Rating', ratingSchema)
