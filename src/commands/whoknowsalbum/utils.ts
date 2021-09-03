import { either } from 'fp-ts'
import { Release } from '../../database/schemas/release'
import {
  MissingDataError,
  NoRatingsError,
  NoReleaseFoundError,
  RequestError,
  UsernameNotFoundError,
} from '../../errors'
import { getLatestRating } from '../../services/rating'
import { getReleaseFromUrl, searchRelease } from '../../services/release'
import { CommandMessage } from '../../types'
import { getUsername } from '../../utils/arguments'

export const getRelease = async (
  message: CommandMessage
): Promise<
  either.Either<
    | NoReleaseFoundError
    | MissingDataError
    | RequestError
    | UsernameNotFoundError
    | NoRatingsError,
    Release
  >
> => {
  const { maybeUsername, source } = await getUsername(message)()
  const query = message.arguments_.join(' ').trim() || undefined

  if (query !== undefined && source === 'author') {
    // get album info for query
    return searchRelease(query)()
  }

  // get album info for latest rating by user
  if (either.isLeft(maybeUsername)) return maybeUsername
  const username = maybeUsername.right

  const maybeRating = await getLatestRating(username)()
  if (either.isLeft(maybeRating)) return maybeRating
  const {
    release: { issueUrl },
  } = maybeRating.right

  return getReleaseFromUrl(issueUrl)()
}
