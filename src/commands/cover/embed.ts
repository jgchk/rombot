import { MessageEmbed } from 'discord.js'
import { PartialRelease } from '../../database/schemas/partial-release'
import { stringifyArtists } from '../../utils/render'

export const getCoverEmbed = (release: PartialRelease): MessageEmbed => {
  const embed = new MessageEmbed()

  let mainText = `**${stringifyArtists(
    release.artists,
    release.artistDisplayName
  )}** - [${release.title}](${release.issueUrl})`

  if (release.releaseYear !== null) {
    mainText += ` _(${release.releaseYear})_`
  }

  embed.setDescription(mainText)

  return embed
}
