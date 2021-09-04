import cheerio from 'cheerio'
import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { RequestError } from 'got'
import getDatabase from '../../database'
import { FullDate } from '../../database/schemas/full-date'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import {
  MissingDataError,
  NoRatingsError,
  NoReleaseFoundError,
} from '../../errors'
import { ifDefined } from '../../utils/functional'
import { getRequestToken, gott, limiter } from '../../utils/network'
import { getReleaseFromUrl } from '../release'
import { ReleaseRating, getRatingsFromUrl, getRatingsPage } from './utils'

export const getLatestRating =
  (
    username: string
  ): taskEither.TaskEither<
    NoRatingsError | NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating
  > =>
  async () => {
    const maybeRatings = await getLatestRatings(username)
    if (either.isLeft(maybeRatings)) return maybeRatings

    const latestRating = maybeRatings.right[0] || undefined
    if (latestRating === undefined)
      return either.left(new NoRatingsError(username))
    return either.right(latestRating)
  }

export const getLatestRatings = async (
  username: string
): Promise<
  either.Either<
    NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating[]
  >
> => getRatingsPage(username, { sort: { date: -1 } })

export const getNLatestRatings = async (
  username: string,
  n: number
): Promise<
  either.Either<
    NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating[]
  >
> => {
  const ratings: ReleaseRating[] = []
  let page = 1
  while (ratings.length < n) {
    const maybeRatings = await getRatingsPage(username, {
      sort: { date: -1 },
      page,
    })
    if (either.isLeft(maybeRatings)) {
      const error = maybeRatings.left
      return error.name === 'NoReleaseFoundError'
        ? // ran out of ratings, return what we have
          either.right(ratings)
        : // some other error. return the error
          maybeRatings
    }
    ratings.push(...maybeRatings.right)
    page += 1
  }
  return either.right(ratings.slice(0, n))
}

export const getTopRatings = async (
  username: string
): Promise<
  either.Either<
    NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating[]
  >
> => getRatingsPage(username, { sort: { rating: -1, date: -1 } })

export const getNTopRatings = async (
  username: string,
  n: number,
  invert = false
): Promise<
  either.Either<
    NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating[]
  >
> => {
  const ratings: ReleaseRating[] = []
  let page = 1
  while (ratings.length < n) {
    const maybeRatings = await getRatingsPage(username, {
      sort: { rating: invert ? 1 : -1, date: -1 },
      page,
    })
    if (either.isLeft(maybeRatings)) {
      const error = maybeRatings.left
      return error.name === 'NoReleaseFoundError'
        ? // ran out of ratings, return what we have
          either.right(ratings)
        : // some other error. return the error
          maybeRatings
    }
    ratings.push(...maybeRatings.right)
    page += 1
  }
  return either.right(ratings.slice(0, n))
}

export const getRatingForRelease =
  (
    username: string,
    release: Release
  ): taskEither.TaskEither<
    NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating
  > =>
  async () => {
    const maybeRatings = await getRatingsFromUrl(
      `https://rateyourmusic.com/collection/${encodeURIComponent(
        username
      )}/strm_l/${encodeURIComponent(`[${release.id}]`)}`,
      username
    )
    if (either.isLeft(maybeRatings)) return maybeRatings

    const releaseRating = maybeRatings.right.find(
      (rating) => rating.release.issueUrl === release.url
    )
    if (releaseRating === undefined)
      return either.left(new NoReleaseFoundError())

    return either.right(releaseRating)
  }

export const getRatingsForAllIssues = async (
  release: Release
): Promise<either.Either<RequestError | MissingDataError, Rating[]>> => {
  const maybeCombinedRelease = await getReleaseFromUrl(release.combinedUrl)()
  if (either.isLeft(maybeCombinedRelease)) return maybeCombinedRelease
  const combinedRelease = maybeCombinedRelease.right

  const maybeRatings: either.Either<MissingDataError, Rating>[] = []
  let totalRatings = 0
  let page = 1

  do {
    const maybeRatingsPage = await getReleaseRatingPage(combinedRelease, page)
    if (either.isLeft(maybeRatingsPage)) return maybeRatingsPage
    const ratingPage = maybeRatingsPage.right

    maybeRatings.push(...ratingPage.ratings)
    totalRatings += ratingPage.totalRatings
    page += 1
  } while (totalRatings === maybeRatings.length)

  const existingRatings = pipe(
    maybeRatings.filter(either.isRight).map((rating) => rating.right)
  )

  return either.right(existingRatings)
}

const getReleaseRatingPage = async (
  release: Release,
  page: number
): Promise<
  either.Either<
    MissingDataError,
    { ratings: either.Either<MissingDataError, Rating>[]; totalRatings: number }
  >
> => {
  const id = /(\d+)/.exec(release.id)?.[1]
  if (id === undefined)
    return either.left(new MissingDataError(`numeric id in ${release.id}`))

  const maybeRequestToken = await getRequestToken()
  if (either.isLeft(maybeRequestToken)) return maybeRequestToken
  const requestToken = maybeRequestToken.right

  const response = await limiter.schedule(() =>
    gott('https://rateyourmusic.com/httprequest/LoadCatalogPage', {
      method: 'POST',
      form: {
        type: 'l',
        assoc_id: id,
        show_all: true,
        pane: 'ratings',
        page_str: `/${page}`,
        action: 'LoadCatalogPage',
        rym_ajax_req: 1,
        request_token: requestToken,
      },
    })
  )
  const html = response.body.slice(53, -24)
  const $ = cheerio.load(html)

  const ratingElements = $('.catalog_header')
  const friendRatingElements = $(
    '.catalog_header.friend, .my_rating .catalog_header'
  )

  const ratings: either.Either<MissingDataError, Rating>[] =
    friendRatingElements.toArray().map((element) => {
      const $element = $(element)

      const username = $element.find('.catalog_user').text().trim() || undefined
      if (username === undefined)
        return either.left(new MissingDataError('username'))

      const date = pipe(
        $element.parent().find('.catalog_date').text().trim() || undefined,
        ifDefined((string_) => {
          const [day, month, year] = string_.split(' ')
          const fullDate: FullDate = {
            day: Number.parseInt(day),
            month,
            year: Number.parseInt(year),
          }
          return fullDate
        })
      )
      if (date === undefined) return either.left(new MissingDataError('date'))

      const rating =
        pipe(
          $element.find('.catalog_rating img').attr('title') || undefined,
          ifDefined(parseFloat)
        ) ?? null

      const ownership =
        $element.find('.catalog_ownership').text().trim() || null

      return either.right({
        issueUrl: release.url,
        username,
        date,
        rating,
        ownership,
        tags: null,
      })
    })

  const database = await getDatabase()()
  await Promise.all(
    ratings
      .filter(either.isRight)
      .map(({ right: rating }) => database.setRating(rating))
  )

  return either.right({ ratings, totalRatings: ratingElements.length })
}
