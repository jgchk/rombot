import { either, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { getLatestRating, getRatingForRelease } from '../../services/rating'
import { getReleaseFromUrl, searchRelease } from '../../services/release'
import { Command } from '../../types'
import { getUsername } from '../../utils/arguments'
import { getAlbumEmbed } from './embed'

const album: Command = {
  name: 'album',
  aliases: ['ab'],
  description:
    "gets information about your last-rated album or the album you're searching for",
  usage: 'album [QUERY|USER]',
  examples: [
    'ab',
    'album',
    'album Ventura Anderson .Paak',
    'album @user',
    'album ~sharifi',
  ],
  execute: (message) => {
    const query = message.arguments_.join(' ').trim() || undefined

    return pipe(
      getUsername(message),
      taskEither.fromTask,
      taskEither.chain(({ maybeUsername, source }) =>
        query !== undefined && source === 'author'
          ? pipe(
              searchRelease(query),
              taskEither.chain((release) =>
                pipe(
                  option.getRight(maybeUsername),
                  option.traverse(taskEither.ApplicativePar)((username) =>
                    pipe(
                      getRatingForRelease(username, release),
                      taskEither.map(({ rating }) => rating)
                    )
                  ),
                  taskEither.map((rating) => ({ release, rating }))
                )
              )
            )
          : pipe(
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
      ),
      taskEither.map(({ release, rating }) =>
        option.some({
          embeds: [getAlbumEmbed(release, rating)],
        })
      )
    )
  },
}

export default album
