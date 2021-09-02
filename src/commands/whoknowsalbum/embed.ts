import { MessageEmbed, User } from 'discord.js'
import { compareFullDates } from '../../database/schemas/full-date'
import { Release } from '../../database/schemas/release'
import { sum } from '../../utils/math'
import {
  makeUserLink,
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'
import { Rated } from './types'

const getWhoKnowsAlbumEmbed = (
  release: Release,
  ratings: Rated[],
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
    const sortedRatings = ratings.sort((a, b) => {
      const ratingComparison = -(a.rating - b.rating)
      if (ratingComparison !== 0) return ratingComparison
      const dateComparison = -compareFullDates(a.date, b.date)
      if (dateComparison !== 0) return dateComparison
      const usernameComparison = a.username.localeCompare(b.username)
      if (usernameComparison !== 0) return usernameComparison
      return 0
    })

    const usernames = sortedRatings.map((rating) =>
      makeUserLink(rating.username)
    )
    const stars = sortedRatings.map((rating) => stringifyRating(rating.rating))
    const dates = sortedRatings.map((rating) => stringifyFullDate(rating.date))

    // TODO: slices are quick fix before pagination
    embed.addField('Username', usernames.join('\n').slice(0, 1024), true)
    embed.addField('Rating', stars.join('\n').slice(0, 1024), true)
    embed.addField('Date', dates.join('\n').slice(0, 1024), true)

    const averageRating =
      sum(ratings.map((rating) => rating.rating)) / ratings.length
    embed.addField('Average Rating', averageRating.toFixed(2))
  } else {
    description += '\n\nNobody knows this release.'
  }

  embed.setDescription(description)

  return embed
}

export default getWhoKnowsAlbumEmbed
