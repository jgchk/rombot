import { Either, isLeft, left, right } from 'fp-ts/Either'
import { RequestError } from 'got'
import getDatabase from '../../database'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import {
  MissingDataError,
  NoRatingsError,
  NoReleaseFoundError,
} from '../../errors'
import { ReleaseRating, getRatingsFromUrl, getRatingsPage } from './utils'

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
): Promise<Rating[]> => {
  const allUrls = [
    ...new Set([release.url, release.combinedUrl, ...release.issueUrls]),
  ]

  const database = await getDatabase()
  return database.getRatingsForUrls(allUrls)
}
