import { getDatabase } from 'db'
import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'
import type { APIEmbed } from 'discord-api-types/v10'

import { env } from '$lib/env'

import { cmd } from './types'
import { getOption } from './utils'

export const setUsername = cmd(
  {
    name: 'set',
    description: 'Set your RYM username',
    options: [
      {
        name: 'username',
        description: 'Set your RYM username',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'username',
            description: 'Your RYM username',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },
  async (command) => {
    const {
      data: { options = [] },
    } = command

    const discordUser = command.user ?? command.member?.user
    if (!discordUser) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [getErrorEmbed('Could not extract user from command')],
        },
      }
    }

    const subcommand = getOption('username', ApplicationCommandOptionType.Subcommand)(options)
    const username = getOption(
      'username',
      ApplicationCommandOptionType.String
    )(subcommand?.options ?? [])?.value

    if (!username) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: 'You must provide a username' },
      }
    }

    const account = await getDatabase({
      connectionString: env.DATABASE_URL,
    }).accounts.setRymUsername(discordUser.id, username)

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: `Set your RYM username to ${account.rymUsername}` },
    }
  }
)

const getErrorEmbed = (error: string): APIEmbed => ({
  color: 3447003,
  author: {
    name: 'Author Name, it can hold 256 characters',
    icon_url: 'https://i.imgur.com/lm8s41J.png',
  },
  thumbnail: {
    url: 'http://i.imgur.com/p2qNFag.png',
  },
  image: {
    url: 'http://i.imgur.com/yVpymuV.png',
  },
  title: 'This is your title, it can hold 256 characters',
  url: 'https://discord.js.org/#/docs/main/master/class/MessageEmbed',
  description: 'This is the main body of text, it can hold 2048 characters.',
  fields: [
    {
      name: 'This is a single field title, it can hold 256 characters',
      value: 'This is a field value, it can hold 1024 characters.',
      inline: false,
    },
    {
      name: 'Error',
      value: error,
      inline: false,
    },
    {
      name: 'Inline fields',
      value: 'They can have different fields with small headlines, and you can inline them.',
      inline: true,
    },
    {
      name: 'Masked links',
      value:
        'You can put [masked links](https://discord.js.org/#/docs/main/master/class/MessageEmbed) inside of rich embeds.',
      inline: true,
    },
    {
      name: 'Markdown',
      value: 'You can put all the *usual* **__Markdown__** inside of them.',
      inline: true,
    },
    {
      name: '\u200b',
      value: '\u200b',
    },
  ],
  timestamp: new Date().toString(),
  footer: {
    icon_url: 'http://i.imgur.com/w1vhFSR.png',
    text: 'This is the footer text, it can hold 2048 characters',
  },
})
