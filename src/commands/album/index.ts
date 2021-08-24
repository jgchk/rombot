import { isLeft, isRight, right } from 'fp-ts/Either'
import { getLatestRating, getRatingForRelease } from '../../services/rating'
import { getReleaseFromUrl, searchRelease } from '../../services/release'
import { Command } from '../../types'
import { getUsername } from '../../utils/arguments'
import { getRight } from '../../utils/types'
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
  execute: async (message) => {
    const { maybeUsername, source } = await getUsername(message)
    const query = message.arguments_.join(' ').trim() || undefined

    if (query !== undefined && source === 'author') {
      // get album info for query
      const maybeRelease = await searchRelease(query)
      if (isLeft(maybeRelease)) return maybeRelease
      const release = maybeRelease.right

      const username = getRight(maybeUsername)
      const maybeReleaseRating =
        username !== undefined
          ? await getRatingForRelease(username, release)
          : undefined
      const rating =
        maybeReleaseRating !== undefined && isRight(maybeReleaseRating)
          ? maybeReleaseRating.right.rating
          : undefined
      return right({ embeds: [getAlbumEmbed(release, rating)] })
    }

    // get album info for latest rating by user
    if (isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const maybeRating = await getLatestRating(username)
    if (isLeft(maybeRating)) return maybeRating
    const {
      rating,
      release: { issueUrl },
    } = maybeRating.right

    const maybeRelease = await getReleaseFromUrl(issueUrl)
    if (isLeft(maybeRelease)) return maybeRelease

    return right({
      embeds: [getAlbumEmbed(maybeRelease.right, rating)],
    })
  },
}

export default album
