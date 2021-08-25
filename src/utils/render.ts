import { MessageEmbed } from 'discord.js'
import { pipe } from 'fp-ts/function'
import { TimeoutError } from 'got/dist/source'
import set from '../commands/set'
import { Artist } from '../database/schemas/artist'
import { FullDate } from '../database/schemas/full-date'
import { AppError, UsernameNotFoundError } from '../errors'
import { getServerPrefix } from '../services/server'
import { Command, CommandMessage } from '../types'
import { ifDefined } from './functional'
import { makeUserUrl } from './links'

export const makeUsageEmbed = async (
  command: Command,
  message: CommandMessage
): Promise<MessageEmbed> => {
  const prefix = await getServerPrefix(message.message.guildId)
  const embed = new MessageEmbed()
    .setTitle(`${prefix}${command.name} usage`)
    .setDescription(command.description)

  const aliases = [command.name, ...(command.aliases ?? [])]
  embed.addField(
    'Aliases',
    aliases.map((alias) => `\`${prefix}${alias}\``).join(', ')
  )

  embed.addField('Usage', `\`${prefix}${command.usage}\``)

  if (command.examples.length > 0) {
    embed.addField(
      'Examples',
      command.examples.map((example) => `\`${prefix}${example}\``).join('\n')
    )
  }

  return embed
}

export const makeErrorEmbed = async (
  error: AppError,
  message: CommandMessage
): Promise<MessageEmbed> => {
  const embed = new MessageEmbed().setTitle('Error')

  let description = error.message
  if (error instanceof TimeoutError) {
    description += '\n\nIs RYM down?'
  }
  if (error instanceof UsernameNotFoundError) {
    const prefix = await getServerPrefix(message.message.guildId)
    description += `\nYou can set your RYM username with \`${prefix}${set.name}\``
  }

  embed.setDescription(description)
  return embed
}

export const stringifyRating = (rating: number): string => {
  let output = ''
  for (let index = 1; index <= 5; index++) {
    if (index - rating <= 0) output += '★'
    else if (index - rating === 0.5) output += '⯪'
    else output += '☆'
  }
  return output
}

export const stringifyFullDate = (date: FullDate): string =>
  [date.day, date.month, date.year].join(' ')

export const stringifyArtists = (
  artists: Artist[],
  displayName: string | null,
  { links = true } = {}
): string => {
  if (displayName !== null) return displayName
  if (artists.length === 1) return stringifyArtist(artists[0], { link: links })

  const finalArtist = pipe(
    artists.pop(),
    ifDefined((artist) => stringifyArtist(artist, { link: links }))
  )
  if (finalArtist === undefined) throw new Error('Collab has no artists')

  return `${artists
    .map((artist) => stringifyArtist(artist, { link: links }))
    .join(', ')} & ${finalArtist}`
}

const stringifyArtist = (artist: Artist, { link = true } = {}): string =>
  link ? makeLink(artist.name, artist.url) : artist.name

export const makeLink = (title: string, url: string): string =>
  `[${title}](${url})`

export const makeUserLink = (username: string): string =>
  makeLink(username, makeUserUrl(username))
