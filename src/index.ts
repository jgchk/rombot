import { Client, Intents, Message } from 'discord.js'
import { option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { commands } from './commands'
import help from './commands/help'
import { BOT_TOKEN, RYM_PASSWORD, RYM_USERNAME } from './config'
import { login } from './services/login'
import { DEFAULT_PREFIX, getServerPrefix } from './services/server'
import { CommandMessage } from './types'
import { parseArguments } from './utils/arguments'
import { emitButton } from './utils/buttons'
import { undefinedTask } from './utils/functional'
import { makeErrorEmbed, makeUsageEmbed } from './utils/render'

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

client.once('ready', (client_) => {
  // TODO: per-guild prefix
  client_.user.setPresence({
    status: 'online',
    activities: [{ type: 'LISTENING', name: `${DEFAULT_PREFIX}${help.name}` }],
  })
  console.log('Ready!')
})

client.on('messageCreate', async (message) => {
  const prefix = await getServerPrefix(message.guildId)
  if (!message.content.startsWith(prefix)) return

  // void message.reply(
  //   'rombot is currently IP banned from RYM. mocha is working on it :)'
  // )
  // return

  const arguments_ = message.content.split(' ')
  const name = arguments_.shift()?.slice(prefix.length)

  const help = arguments_
    .map((argument) => argument.trim().toLowerCase())
    .includes('help')

  if (name === undefined) return

  const command = commands.find(
    (cmd) => cmd.name === name || cmd.aliases?.some((alias) => alias === name)
  )

  if (command === undefined) {
    // TODO: make this better
    await message.reply('Unknown command')
  } else {
    const commandMessage: CommandMessage = {
      message,
      command,
      name,
      arguments_,
    }

    if (help) {
      void message.channel.sendTyping()
      await commandMessage.message.reply({
        embeds: [await makeUsageEmbed(commandMessage)],
      })
    } else {
      void message.channel.sendTyping()
      const interval = setInterval(
        () => void message.channel.sendTyping(),
        10 * 1000
      )

      try {
        await pipe(
          command.execute(commandMessage),
          taskEither.fold(
            (error) => handleError(error, commandMessage),
            option.foldW(
              () => undefinedTask,
              (payload) => () => message.reply(payload)
            )
          )
        )()
      } catch (error) {
        await handleError(error, commandMessage)()
      } finally {
        clearInterval(interval)
      }
    }
  }
})

client.on('interactionCreate', (interaction) => {
  if (interaction.isButton()) {
    emitButton(interaction)
  }
})

const handleError =
  (error: Error, commandMessage: CommandMessage): task.Task<Message> =>
  async () =>
    commandMessage.message.reply({
      embeds: [
        error.name === 'UsageError'
          ? await makeUsageEmbed(commandMessage)
          : await makeErrorEmbed(error, commandMessage),
      ],
    })

if (BOT_TOKEN !== undefined) {
  void client.login(BOT_TOKEN)
} else {
  console.error('BOT_TOKEN not found. Make sure to enter it in config.json')
}

if (RYM_USERNAME !== undefined && RYM_PASSWORD !== undefined) {
  void login(RYM_USERNAME, RYM_PASSWORD)
} else {
  console.error(
    'RYM_USERNAME or RYM_PASSWORD not found. Make sure to enter them into config.json'
  )
}
