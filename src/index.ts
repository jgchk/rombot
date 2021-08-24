import { Client, Intents } from 'discord.js'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import album from './commands/album'
import chart from './commands/chart'
import latest from './commands/latest'
import recent from './commands/recent'
import set from './commands/set'
import whoknowsalbum from './commands/whoknowsalbum'
import { BOT_TOKEN, PREFIX } from './config'
import { makeErrorEmbed, makeUsageEmbed } from './utils/render'

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

client.once('ready', () => console.log('Ready!'))

const commands = [set, album, latest, whoknowsalbum, recent, chart]

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(PREFIX)) return

  const arguments_ = message.content.split(' ')
  const name = arguments_.shift()?.slice(PREFIX.length)

  if (name === undefined) return

  const command = commands.find(
    (cmd) => cmd.name === name || cmd.aliases?.some((alias) => alias === name)
  )

  if (command === undefined) {
    // TODO: make this better
    void message.reply('Unknown command')
  } else {
    await message.channel.sendTyping()
    void pipe(
      await command.execute({ message, name, arguments_: arguments_ }),
      fold(
        (error) => {
          if (error.name === 'UsageError')
            return message.reply({ embeds: [makeUsageEmbed(command)] })
          return message.reply({ embeds: [makeErrorEmbed(error)] })
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
