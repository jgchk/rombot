import { Rating } from '../../database/schemas/rating'

export type Rated = Rating & { rating: number }

export const isRated = (rating: Rating): rating is Rated =>
  rating.rating !== null
