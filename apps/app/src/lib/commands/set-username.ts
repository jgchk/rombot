import { getDatabase } from 'db'
import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'

import { env } from '$lib/env'

import { cmd } from './types'
import { getErrorEmbed, getOption } from './utils'

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
