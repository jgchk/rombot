import { MessageEmbed, User } from 'discord.js'
import { compareFullDates } from '../../database/schemas/full-date'
import { Release } from '../../database/schemas/release'
import { getServerPrefix } from '../../services/server'
import { CommandMessage } from '../../types'
import { sum } from '../../utils/math'
import {
  makeUserLink,
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'
import ratingCommand from '../rating'
import { Rated } from './types'

const getWhoKnowsAlbumEmbed = async (
  release: Release,
  ratings: Rated[],
  user: User,
  message: CommandMessage
): Promise<MessageEmbed> => {
  const embed = new MessageEmbed().setAuthor(
    `Who knows ${release.title} in RateOurMusic`,
    user.displayAvatarURL(),
    release.url
  )

  if (release.cover !== null) {
    embed.setThumbnail(release.cover)
  }

  let description = `**${stringifyArtists(
    release.artists,
    release.artistDisplayName
  )}** - [${release.title}](${release.url})`
  if (release.releaseDate !== null) {
    description += ` _(${release.releaseDate.year})_`
  }

  if (ratings.length > 0) {
    const sortedRatings = ratings.sort((a, b) => {
      const dateComparison = -compareFullDates(a.date, b.date)
      if (dateComparison !== 0) return dateComparison
      const usernameComparison = a.username.localeCompare(b.username)
      if (usernameComparison !== 0) return usernameComparison
      return a.rating - b.rating
    })

    const usernames = sortedRatings.map((rating) =>
      makeUserLink(rating.username)
    )
    const stars = sortedRatings.map((rating) => stringifyRating(rating.rating))
    const dates = sortedRatings.map((rating) => stringifyFullDate(rating.date))

    embed.addField('Username', usernames.join('\n'), true)
    embed.addField('Rating', stars.join('\n'), true)
    embed.addField('Date', dates.join('\n'), true)

    const averageRating =
      sum(ratings.map((rating) => rating.rating)) / ratings.length
    embed.addField('Average Rating', averageRating.toFixed(2))
  } else {
    description += '\n\nNobody knows this release.'
  }

  embed.setDescription(description)

  const prefix = await getServerPrefix(message.message.guildId)
  embed.addField(
    '\u200B',
    `\n\n _Rating missing or out of date? Log it with \`${prefix}${ratingCommand.name}\`_`
  )

  return embed
}

export default getWhoKnowsAlbumEmbed
