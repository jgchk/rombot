import { isLeft, right } from 'fp-ts/Either'
import { getRatingsForAllIssues } from '../../services/rating'
import { Command } from '../../types'
import getWhoKnowsAlbumEmbed from './embed'
import { isRated } from './types'
import { getRelease } from './utils'

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
    const maybeRelease = await getRelease(message)
    if (isLeft(maybeRelease)) return maybeRelease
    const release = maybeRelease.right

    const maybeRatings = await getRatingsForAllIssues(release)
    if (isLeft(maybeRatings)) return maybeRatings
    const ratings = maybeRatings.right.filter(isRated)

    return right({
      embeds: [getWhoKnowsAlbumEmbed(release, ratings, message.message.author)],
    })
  },
}

export default whoknowsalbum
