import { MessageEmbed, User } from 'discord.js'
import { ReleaseRating } from '../../services/rating/utils'
import { makeUserUrl } from '../../utils/links'
import {
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'

export const getRecentEmbed = (
  releaseRatings: ReleaseRating[],
  user: User,
  username: string
): MessageEmbed => {
  const embed = new MessageEmbed().setAuthor(
    `Recent ratings for ~${username}`,
    user.displayAvatarURL(),
    makeUserUrl(username)
  )

  const lines: string[] = []
  for (const { release, rating } of releaseRatings) {
    let text = ''

    if (rating.rating !== null) {
      text += `${stringifyRating(rating.rating)}\n`
    }

    text += `**${stringifyArtists(
      release.artists,
      release.artistDisplayName
    )}** - [${release.title}](${release.issueUrl})`

    if (release.releaseYear !== null) {
      text += ` _(${release.releaseYear})_`
    }

    text += `\nRated ${stringifyFullDate(rating.date)}`

    lines.push(text)
  }

  embed.setDescription(lines.join('\n\n'))

  return embed
}
