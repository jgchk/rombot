import { isLeft, isRight, right } from 'fp-ts/Either'
import { getLatestRating, getRatingForRelease } from '../../services/rating'
import { getReleaseFromUrl, searchRelease } from '../../services/release'
import { Command } from '../../types'
import { getUsername } from '../../utils/arguments'
import { getRatingEmbed } from './embed'

const rating: Command = {
  name: 'rating',
  aliases: ['ra'],
  description:
    "shows your rating for your last-rating album or the album you're searching for",
  usage: 'rating [QUERY]',
  examples: ['rating', 'rating 808s & heartbreak'],
  execute: async (message) => {
    const { maybeUsername, source } = await getUsername(message)
    const query = message.arguments_.join(' ').trim() || undefined

    if (query !== undefined && source === 'author') {
      if (isLeft(maybeUsername)) return maybeUsername
      const username = maybeUsername.right

      // get album info for query
      const maybeRelease = await searchRelease(query)
      if (isLeft(maybeRelease)) return maybeRelease
      const release = maybeRelease.right

      const maybeReleaseRating =
        username !== undefined
          ? await getRatingForRelease(username, release)
          : undefined
      const rating =
        maybeReleaseRating !== undefined && isRight(maybeReleaseRating)
          ? maybeReleaseRating.right.rating
          : undefined
      return right({
        embeds: [
          getRatingEmbed(rating, release, message.message.author, username),
        ],
      })
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
    const release = maybeRelease.right

    return right({
      embeds: [
        getRatingEmbed(rating, release, message.message.author, username),
      ],
    })
  },
}

export default rating
