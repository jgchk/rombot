import { either, option } from 'fp-ts'
import { getLatestRating } from '../../services/rating'
import { Command } from '../../types'
import { getUsername } from '../../utils/arguments'
import { getLatestEmbed } from './embed'

const latest: Command = {
  name: 'latest',
  aliases: [''],
  description: 'shows your latest rating',
  usage: 'latest [USER]',
  examples: ['', 'latest', 'latest @user', 'latest ~sharifi'],
  execute: (message) => async () => {
    const { maybeUsername } = await getUsername(message)()
    if (either.isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const maybeRating = await getLatestRating(username)()
    if (either.isLeft(maybeRating)) return maybeRating
    const { rating, release } = maybeRating.right

    return either.right(
      option.some({
        embeds: [
          getLatestEmbed(rating, release, message.message.author, username),
        ],
      })
    )
  },
}

export default latest
