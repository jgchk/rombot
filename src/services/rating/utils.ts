import cheerio from 'cheerio'
import { Either, isLeft, right } from 'fp-ts/Either'
import { RequestError } from 'got'
import getDatabase from '../../database'
import { PartialRelease } from '../../database/schemas/partial-release'
import { Rating } from '../../database/schemas/rating'
import { MissingDataError } from '../../errors'
import { gott, limiter } from '../../utils/network'
import { parseRating } from './scraper'

export type ReleaseRating = {
  rating: Rating
  release: PartialRelease
}

export const getRatingsFromUrl = async (
  url: string,
  username: string
): Promise<Either<RequestError | MissingDataError, ReleaseRating[]>> => {
  const response = await limiter.schedule(() => gott(url))
  const $ = cheerio.load(response.body)

  const elements = $('[id^=page_catalog_item]')
    .toArray()
    .filter((element) => $(element).find('.or_q_albumartist_td').length > 0)

  const ratings: ReleaseRating[] = []
  for (const element of elements) {
    const maybeRating = parseRating($(element), username)
    if (isLeft(maybeRating)) return maybeRating
    ratings.push(maybeRating.right)
  }

  const database = await getDatabase()
  await Promise.all(ratings.map((rating) => database.setRating(rating.rating)))

  return right(ratings)
}

export type GetRatingsPageOptions = {
  page?: number
  sort?: Partial<{ [k in RatingsPageSortParameters]: number }>
}
export type RatingsPageSortParameters = 'date' | 'rating'
const ratingPageParameterMap: Record<RatingsPageSortParameters, string> = {
  date: 'd',
  rating: 'r',
}
export const getRatingsPage = async (
  username: string,
  options?: GetRatingsPageOptions
): Promise<Either<RequestError | MissingDataError, ReleaseRating[]>> => {
  const { page = 1, sort } = options ?? {}

  let queryString = 'r0.5-5.0'
  if (sort !== undefined) {
    const sortKeys = Object.keys(sort) as RatingsPageSortParameters[]
    if (sortKeys.length > 0) {
      queryString += ',ss'
      for (const key of sortKeys) {
        let parameterSymbol = ratingPageParameterMap[key]
        const direction = sort[key]
        if (direction !== undefined && direction < 0) {
          parameterSymbol += 'd'
        }
        queryString += '.' + parameterSymbol
      }
    }
  }

  const url = `https://rateyourmusic.com/collection/${encodeURIComponent(
    username
  )}/${queryString}/${page}`

  return getRatingsFromUrl(url, username)
}
