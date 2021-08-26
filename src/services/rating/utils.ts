import cheerio from 'cheerio'
import { Either, isLeft, right } from 'fp-ts/Either'
import got, { RequestError } from 'got'
import getDatabase, { Database } from '../../database'
import { PartialRelease } from '../../database/schemas/partial-release'
import { Rating } from '../../database/schemas/rating'
import { MissingDataError } from '../../errors'
import limiter from '../../utils/network'
import { parseRating } from './scraper'

export type ReleaseRating = {
  rating: Rating
  release: PartialRelease
}

export const saveReleaseRating = async (
  database: Database,
  { release, rating }: ReleaseRating
): Promise<[Rating, PartialRelease]> =>
  Promise.all([database.setRating(rating), database.setPartialRelease(release)])

export const getRatingsFromUrl = async (
  url: string,
  username: string
): Promise<Either<RequestError | MissingDataError, ReleaseRating[]>> => {
  const response = await limiter.schedule(() => got(url))
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
  await Promise.all(
    ratings.map((rating) => saveReleaseRating(database, rating))
  )

  return right(ratings)
}
