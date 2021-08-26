import { MessageEmbed, User } from 'discord.js'
import { makeUserUrl } from '../../utils/links'
import { makeUserLink } from '../../utils/render'

export const getChartEmbed = (
  size: number,
  numberOfRatings: number,
  invertOrder: boolean,
  user: User,
  username: string
): MessageEmbed => {
  const embed = new MessageEmbed()
    .setAuthor(
      `${size}x${size} chart for ~${username}`,
      user.displayAvatarURL(),
      makeUserUrl(username)
    )
    .setDescription(
      `${
        invertOrder ? 'Bottom' : 'Top'
      } ratings out of last ${numberOfRatings} for ~${makeUserLink(username)}`
    )
  return embed
}
