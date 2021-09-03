import { MessageEmbed } from 'discord.js'
import { option } from 'fp-ts'
import { right } from 'fp-ts/Either'
import { getServerPrefix } from '../services/server'
import { Command } from '../types'
import album from './album'
import latest from './latest'
import set from './set'
import { commands } from '.'

const help: Command = {
  name: 'help',
  aliases: ['commands'],
  description: 'shows information about getting started with the bot',
  usage: 'help',
  examples: ['help'],
  execute: (message) => async () => {
    const prefix = await getServerPrefix(message.message.guildId)
    const embed = new MessageEmbed()

    let description = ''

    description += '**To get started**'
    description += `\nSet your RYM username with \`${prefix}${set.usage}\``
    description += `\nFor example: \`${prefix}${set.examples[0]}\``
    description += '\n_Note: this is case-sensitive_'
    description += '\n\n'

    description += '**See a list of all available commands below**'
    description +=
      '\nTo view information about specific commands add help after the command'
    description += `\nSome examples are: \`${prefix}${latest.name} help\` and \`${prefix}${album.name} help\``
    description += '\n\n'
    description += commands
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((command) => `\`${prefix}${command.name}\``)
      .join(', ')

    embed.setDescription(description)

    return right(option.some({ embeds: [embed] }))
  },
}

export default help
