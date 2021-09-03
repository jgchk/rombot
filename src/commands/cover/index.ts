import { option } from 'fp-ts'
import { isLeft, left, right } from 'fp-ts/Either'
import { releaseToPartialRelease } from '../../database/schemas/partial-release'
import { MissingDataError } from '../../errors'
import { getSlowCover } from '../../services/cover'
import { getLatestRating } from '../../services/rating'
import { searchRelease } from '../../services/release'
import { Command } from '../../types'
import { getUsername } from '../../utils/arguments'
import { getCoverEmbed } from './embed'

const cover: Command = {
  name: 'cover',
  aliases: ['co'],
  description:
    "shows the cover for your last-rated album or the album you're searching for",
  usage: 'album [QUERY|USER]',
  examples: [
    'co',
    'cover',
    'album la priest inji',
    'album @user',
    'album ~sharifi',
  ],
  execute: (message) => async () => {
    const { maybeUsername, source } = await getUsername(message)
    const query = message.arguments_.join(' ').trim() || undefined

    if (query !== undefined && source === 'author') {
      // get album info for query
      const maybeRelease = await searchRelease(query)
      if (isLeft(maybeRelease)) return maybeRelease

      const release = maybeRelease.right
      const partialRelease = releaseToPartialRelease(release)

      const cover = await getSlowCover(partialRelease)
      if (cover === undefined) return left(new MissingDataError('cover'))

      return right(
        option.some({ files: [cover], embeds: [getCoverEmbed(partialRelease)] })
      )
    }

    // get album info for latest rating by user
    if (isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const maybeRating = await getLatestRating(username)
    if (isLeft(maybeRating)) return maybeRating
    const { release } = maybeRating.right

    const cover = await getSlowCover(release)
    if (cover === undefined) return left(new MissingDataError('cover'))

    return right(
      option.some({ files: [cover], embeds: [getCoverEmbed(release)] })
    )
  },
}

export default cover
