import { either, option, task, taskEither, taskOption } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import { UsernameNotFoundError } from '../../errors'
import { getLatestRating, getRatingForRelease } from '../../services/rating'
import { getReleaseFromUrl, searchRelease } from '../../services/release'
import { Command } from '../../types'
import { getUsernameAndQuery, parseArguments } from '../../utils/arguments'
import { getAlbumEmbed } from './embed'

const album: Command = {
  name: 'album',
  aliases: ['ab'],
  description:
    "gets information about your last-rated album or the album you're searching for",
  usage: 'album [USER] [QUERY]',
  examples: [
    'ab',
    'album',
    'album Ventura Anderson .Paak',
    'album @user',
    'album ~sharifi',
    'album @user the white album',
  ],
  execute: (message) =>
    pipe(
      parseArguments(message),
      getUsernameAndQuery,
      task.chain(({ maybeQuery, maybeUsername }) =>
        pipe(
          maybeQuery,
          option.fold(
            () => getReleaseAndRatingFromLatest(maybeUsername),
            (query) => getReleaseAndRatingFromQuery(query, maybeUsername)
          )
        )
      ),
      taskEither.map(({ release, rating }) =>
        option.some({
          embeds: [getAlbumEmbed(release, rating)],
        })
      )
    ),
}

const getReleaseAndRatingFromLatest = (
  maybeUsername: either.Either<UsernameNotFoundError, string>
) =>
  pipe(
    maybeUsername,
    either.traverse(taskEither.ApplicativePar)((username) =>
      getLatestRating(username)
    ),
    taskEither.chainW(taskEither.fromEither),
    taskEither.chainW(({ rating, release: { issueUrl } }) =>
      pipe(
        getReleaseFromUrl(issueUrl),
        taskEither.map((release) => ({
          release,
          rating: option.some(rating),
        }))
      )
    )
  )

const getReleaseAndRatingFromQuery = (
  query: string,
  maybeUsername: either.Either<UsernameNotFoundError, string>
) =>
  pipe(
    searchRelease(query),
    taskEither.chain((release) =>
      taskEither.fromTask(
        pipe(
          taskOption.fromEither(maybeUsername),
          taskOption.chain((username) => getOptionalRating(username, release)),
          task.map((rating) => ({ release, rating }))
        )
      )
    )
  )

const getOptionalRating = (
  username: string,
  release: Release
): taskOption.TaskOption<Rating> =>
  pipe(
    getRatingForRelease(username, release),
    taskOption.fromTaskEither,
    taskOption.map(({ rating }) => rating)
  )

export default album
