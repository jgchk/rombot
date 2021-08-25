import cheerio from 'cheerio'
import { Either, isLeft, left, right } from 'fp-ts/Either'
import { RequestError } from 'got/dist/source'
import getDatabase, { Database } from '../../database'
import { PartialRelease } from '../../database/schemas/partial-release'
import { Rating } from '../../database/schemas/rating'
import { MissingDataError } from '../../errors'
import network from '../../network'
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
  const maybeResponse = await network.get(url)
  if (isLeft(maybeResponse)) return left(maybeResponse.left)

  const $ = cheerio.load(maybeResponse.right.body)

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
