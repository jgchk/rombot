import { Either, isLeft, left, right } from 'fp-ts/Either'
import getDatabase from '../../database'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import {
  MissingDataError,
  NoRatingsError,
  NoReleaseFoundError,
  UsernameDoesntExistError,
} from '../../errors'
import { ReleaseRating, getRatingsFromPage } from './utils'

export const getLatestRating = async (
  username: string
): Promise<
  Either<
    | NoRatingsError
    | NoReleaseFoundError
    | UsernameDoesntExistError
    | MissingDataError,
    ReleaseRating
  >
> => {
  const maybeRatings = await getLatestRatings(username)
  if (isLeft(maybeRatings)) return maybeRatings

  const latestRating = maybeRatings.right[0] || undefined
  if (latestRating === undefined) return left(new NoRatingsError(username))
  return right(latestRating)
}

export const getNLatestRatings = async (
  username: string,
  n: number
): Promise<
  Either<
    NoReleaseFoundError | UsernameDoesntExistError | MissingDataError,
    ReleaseRating[]
  >
> => {
  const maybeRatings = await getLatestRatings(username)
  if (isLeft(maybeRatings)) return maybeRatings

  return right(maybeRatings.right.slice(0, n))
}

export const getLatestRatings = async (
  username: string
): Promise<
  Either<
    NoReleaseFoundError | UsernameDoesntExistError | MissingDataError,
    ReleaseRating[]
  >
> =>
  getRatingsFromPage(
    `https://rateyourmusic.com/collection/${encodeURIComponent(
      username
    )}/r0.5-5.0,ss.dd`,
    username
  )

export const getRatingForRelease = async (
  username: string,
  release: Release
): Promise<
  Either<
    NoReleaseFoundError | UsernameDoesntExistError | MissingDataError,
    ReleaseRating
  >
> => {
  const maybeRatings = await getRatingsFromPage(
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
