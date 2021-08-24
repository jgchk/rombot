import { MessageEmbed, User } from 'discord.js'
import { PREFIX } from '../../config'
import { compareFullDates } from '../../database/schemas/full-date'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import {
  makeUserLink,
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'
import album from '../album'

type Rated = Rating & { rating: number }
const isRated = (rating: Rating): rating is Rated => rating.rating !== null

const getChartEmbed = (
  release: Release,
  ratings: Rating[],
  user: User
): MessageEmbed => {
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
    const sortedRatings = ratings.filter(isRated).sort((a, b) => {
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
  } else {
    description += '\n\nNo ratings found.'
  }

  embed.setDescription(description)

  embed.addField(
    '\u200B',
    `\n\n _Don't see your rating? Make sure you log it with \`${PREFIX}${album.name}\`_`
  )

  return embed
}

export default getChartEmbed
