import { MessageEmbed, User } from 'discord.js'
import { makeUserUrl } from '../../utils/links'
import { makeUserLink } from '../../utils/render'
import { Amount } from './types'

export const getChartEmbed = (
  size: number,
  amount: Amount,
  invertOrder: boolean,
  user: User,
  username: string
): MessageEmbed => {
  const embed = new MessageEmbed().setAuthor(
    `${size}x${size} chart for ~${username}`,
    user.displayAvatarURL(),
    makeUserUrl(username)
  )

  let description = invertOrder ? 'Bottom' : 'Top'
  description +=
    amount === 'alltime'
      ? ' all time ratings'
      : ` ratings out of last ${amount}`
  description += ` for ${makeUserLink(username)}`

  embed.setDescription(description)

  return embed
}
