import cheerio from 'cheerio'
import { Either, isLeft, isRight, left, right } from 'fp-ts/Either'
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
import { getRatingsFromUrl, getRatingsPage, ReleaseRating } from './utils'

export const getLatestRating = async (
  username: string
): Promise<
  Either<
    NoRatingsError | NoReleaseFoundError | RequestError | MissingDataError,
    ReleaseRating
  >
> => {
  const maybeRatings = await getLatestRatings(username)
  if (isLeft(maybeRatings)) return maybeRatings

  const latestRating = maybeRatings.right[0] || undefined
  if (latestRating === undefined) return left(new NoRatingsError(username))
  return right(latestRating)
}

export const getLatestRatings = async (
  username: string
): Promise<
  Either<NoReleaseFoundError | RequestError | MissingDataError, ReleaseRating[]>
> => getRatingsPage(username, { sort: { date: -1 } })

export const getNLatestRatings = async (
  username: string,
  n: number
): Promise<
  Either<NoReleaseFoundError | RequestError | MissingDataError, ReleaseRating[]>
> => {
  const ratings: ReleaseRating[] = []
  let page = 1
  while (ratings.length < n) {
    const maybeRatings = await getRatingsPage(username, {
      sort: { date: -1 },
      page,
    })
    if (isLeft(maybeRatings)) {
      const error = maybeRatings.left
      return error.name === 'NoReleaseFoundError'
        ? // ran out of ratings, return what we have
          right(ratings)
        : // some other error. return the error
          maybeRatings
    }
    ratings.push(...maybeRatings.right)
    page += 1
  }
  return right(ratings.slice(0, n))
}

export const getTopRatings = async (
  username: string
): Promise<
  Either<NoReleaseFoundError | RequestError | MissingDataError, ReleaseRating[]>
> => getRatingsPage(username, { sort: { rating: -1, date: -1 } })

export const getNTopRatings = async (
  username: string,
  n: number,
  invert = false
): Promise<
  Either<NoReleaseFoundError | RequestError | MissingDataError, ReleaseRating[]>
> => {
  const ratings: ReleaseRating[] = []
  let page = 1
  while (ratings.length < n) {
    const maybeRatings = await getRatingsPage(username, {
      sort: { rating: invert ? 1 : -1, date: -1 },
      page,
    })
    if (isLeft(maybeRatings)) {
      const error = maybeRatings.left
      return error.name === 'NoReleaseFoundError'
        ? // ran out of ratings, return what we have
          right(ratings)
        : // some other error. return the error
          maybeRatings
    }
    ratings.push(...maybeRatings.right)
    page += 1
  }
  return right(ratings.slice(0, n))
}

export const getRatingForRelease = async (
  username: string,
  release: Release
): Promise<
  Either<NoReleaseFoundError | RequestError | MissingDataError, ReleaseRating>
> => {
  const maybeRatings = await getRatingsFromUrl(
    `https://rateyourmusic.com/collection/${encodeURIComponent(
      username
    )}/strm_l/${encodeURIComponent(`[${release.id}]`)}`,
    username
  )
  if (isLeft(maybeRatings)) return maybeRatings

  const releaseRating = maybeRatings.right.find(
    (rating) => rating.release.issueUrl === release.url
  )
  if (releaseRating === undefined) return left(new NoReleaseFoundError())

  return right(releaseRating)
}

export const getRatingsForAllIssues = async (
  release: Release
): Promise<Either<RequestError | MissingDataError, Rating[]>> => {
  const maybeCombinedRelease = await getReleaseFromUrl(release.combinedUrl)
  if (isLeft(maybeCombinedRelease)) return maybeCombinedRelease
  const combinedRelease = maybeCombinedRelease.right

  const allRatings: Either<MissingDataError, Rating>[] = []
  let totalRatings = 0
  let page = 1

  do {
    const maybeRatings = await getReleaseRatingPage(combinedRelease, page)
    if (isLeft(maybeRatings)) return maybeRatings

    allRatings.push(...maybeRatings.right.ratings)
    totalRatings += maybeRatings.right.totalRatings
    page += 1
  } while (totalRatings === allRatings.length)

  return right(allRatings.filter(isRight).map((rating) => rating.right))
}

const getReleaseRatingPage = async (
  release: Release,
  page: number
): Promise<
  Either<
    MissingDataError,
    { ratings: Either<MissingDataError, Rating>[]; totalRatings: number }
  >
> => {
  const id = /(\d+)/.exec(release.id)?.[1]
  if (id === undefined)
    return left(new MissingDataError(`numeric id in ${release.id}`))

  const maybeRequestToken = await getRequestToken()
  if (isLeft(maybeRequestToken)) return maybeRequestToken
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

  const ratings: Either<MissingDataError, Rating>[] = friendRatingElements
    .toArray()
    .map((element) => {
      const $element = $(element)

      const username = $element.find('.catalog_user').text().trim() || undefined
      if (username === undefined) return left(new MissingDataError('username'))

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
      if (date === undefined) return left(new MissingDataError('date'))

      const rating =
        pipe(
          $element.find('.catalog_rating img').attr('title') || undefined,
          ifDefined(parseFloat)
        ) ?? null

      const ownership =
        $element.find('.catalog_ownership').text().trim() || null

      return right({
        issueUrl: release.url,
        username,
        date,
        rating,
        ownership,
        tags: null,
      })
    })

  const database = await getDatabase()
  await Promise.all(
    ratings
      .filter(isRight)
      .map(({ right: rating }) => database.setRating(rating))
  )

  return right({ ratings, totalRatings: ratingElements.length })
}
