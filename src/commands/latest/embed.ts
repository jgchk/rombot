import { MessageEmbed, User } from 'discord.js'
import { PartialRelease } from '../../database/schemas/partial-release'
import { Rating } from '../../database/schemas/rating'
import { makeUserUrl } from '../../utils/links'
import {
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'

export const getLatestEmbed = (
  rating: Rating,
  release: PartialRelease,
  user: User,
  username: string
): MessageEmbed => {
  const embed = new MessageEmbed()
    .setAuthor(
      `Latest rating for ~${username}`,
      user.displayAvatarURL(),
      makeUserUrl(username)
    )
    .setFooter(`Rated ${stringifyFullDate(rating.date)}`)

  if (release.coverThumbnail !== null) {
    embed.setThumbnail(release.coverThumbnail)
  }

  let mainText = ''
  if (rating.rating !== null) {
    mainText += `${stringifyRating(rating.rating)}\n`
  }
  mainText += `**${stringifyArtists(
    release.artists,
    release.artistDisplayName
  )}** - [${release.title}](${release.issueUrl})`
  if (release.releaseYear !== null) {
    mainText += ` _(${release.releaseYear})_`
  }
  embed.setDescription(mainText)

  return embed
}
