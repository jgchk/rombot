import { isLeft, right } from 'fp-ts/Either'
import {
  getLatestRating,
  getRatingForRelease,
  getRatingsForAllIssues,
} from '../../services/rating'
import { getReleaseFromUrl, searchRelease } from '../../services/release'
import { Command } from '../../types'
import { getUsername } from '../../utils/arguments'
import { getRight } from '../../utils/types'
import getWhoKnowsAlbumEmbed from './embed'

const whoknowsalbum: Command = {
  name: 'whoknowsalbum',
  aliases: ['whoknows', 'wkab', 'wka', 'wa', 'wk', 'w'],
  description:
    "shows who in your server rated your last-rated album or the album you're searching for",
  usage: 'whoknowsalbum [QUERY|USER]',
  examples: [
    'wa',
    'whoknowsalbum',
    'whoknowsalbum The Beatles Abbey Road',
    'whoknowsalbum @user',
    'whoknowsalbum ~sharifi',
  ],
  execute: async (message) => {
    const { maybeUsername, source } = await getUsername(message)
    const query = message.arguments_.join(' ').trim() || undefined

    if (query !== undefined && source === 'author') {
      // get album info for query
      const maybeRelease = await searchRelease(query)
      if (isLeft(maybeRelease)) return maybeRelease
      const release = maybeRelease.right

      // if user has username set, fetch and store their rating
      const username = getRight(maybeUsername)
      if (username !== undefined) await getRatingForRelease(username, release)

      const ratings = await getRatingsForAllIssues(release)

      return right({
        embeds: [
          await getWhoKnowsAlbumEmbed(
            release,
            ratings,
            message.message.author,
            message
          ),
        ],
      })
    }

    // get album info for latest rating by user
    if (isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const maybeRating = await getLatestRating(username)
    if (isLeft(maybeRating)) return maybeRating
    const {
      release: { issueUrl },
    } = maybeRating.right

    const maybeRelease = await getReleaseFromUrl(issueUrl)
    if (isLeft(maybeRelease)) return maybeRelease
    const release = maybeRelease.right

    const ratings = await getRatingsForAllIssues(release)

    return right({
      embeds: [
        await getWhoKnowsAlbumEmbed(
          release,
          ratings,
          message.message.author,
          message
        ),
      ],
    })
  },
}

export default whoknowsalbum
