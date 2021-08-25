import { Client, Intents } from 'discord.js'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import album from './commands/album'
import chart from './commands/chart'
import cover from './commands/cover'
import latest from './commands/latest'
import prefix from './commands/prefix'
import recent from './commands/recent'
import set from './commands/set'
import whoknowsalbum from './commands/whoknowsalbum'
import { BOT_TOKEN } from './config'
import { getServerPrefix } from './services/server'
import { CommandMessage } from './types'
import { makeErrorEmbed, makeUsageEmbed } from './utils/render'

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

client.once('ready', () => console.log('Ready!'))

const commands = [
  set,
  album,
  latest,
  whoknowsalbum,
  recent,
  chart,
  cover,
  prefix,
]

client.on('messageCreate', async (message) => {
  const prefix = await getServerPrefix(message.guildId)
  if (!message.content.startsWith(prefix)) return

  const arguments_ = message.content.split(' ')
  const name = arguments_.shift()?.slice(prefix.length)

  if (name === undefined) return

  const command = commands.find(
    (cmd) => cmd.name === name || cmd.aliases?.some((alias) => alias === name)
  )

  if (command === undefined) {
    // TODO: make this better
    void message.reply('Unknown command')
  } else {
    await message.channel.sendTyping()
    const commandMessage: CommandMessage = { message, name, arguments_ }
    void pipe(
      await command.execute(commandMessage),
      fold(
        async (error) => {
          if (error.name === 'UsageError')
            return message.reply({
              embeds: [await makeUsageEmbed(command, commandMessage)],
            })
          return message.reply({
            embeds: [await makeErrorEmbed(error, commandMessage)],
          })
        },
        (response) => message.reply(response)
      )
    )
  }
})

if (BOT_TOKEN !== undefined) {
  void client.login(BOT_TOKEN)
} else {
  console.error('BOT_TOKEN not found. Make sure to enter it in config.json')
}
