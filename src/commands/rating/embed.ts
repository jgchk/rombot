import { MessageEmbed, User } from 'discord.js'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import { makeUserUrl } from '../../utils/links'
import {
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'

export const getRatingEmbed = (
  rating: Rating | undefined,
  release: Release,
  user: User,
  username: string
): MessageEmbed => {
  const embed = new MessageEmbed().setAuthor(
    `Latest rating for ~${username}`,
    user.displayAvatarURL(),
    makeUserUrl(username)
  )

  if (rating !== undefined) {
    embed.setFooter(`Rated ${stringifyFullDate(rating.date)}`)
  }

  if (release.cover !== null) {
    embed.setThumbnail(release.cover)
  }

  let mainText = ''
  mainText +=
    rating !== undefined && rating.rating !== null
      ? `${stringifyRating(rating.rating)}\n`
      : 'No rating\n'
  mainText += `**${stringifyArtists(
    release.artists,
    release.artistDisplayName
  )}** - [${release.title}](${release.url})`
  if (release.releaseDate !== null) {
    mainText += ` _(${release.releaseDate.year})_`
  }
  embed.setDescription(mainText)

  return embed
}
