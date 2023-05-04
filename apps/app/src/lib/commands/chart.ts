import { getDatabase } from 'db'
import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'

import { env } from '$lib/env'

import { cmd } from './types'
import { getErrorEmbed, getOption } from './utils'

export const chart = cmd(
  {
    name: 'chart',
    description: 'Generate a chart of your ratings',
    options: [
      {
        name: 'username',
        description: 'The RYM username to generate a chart for (defaults to self)',
        type: ApplicationCommandOptionType.String,
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

    let username = getOption('username', ApplicationCommandOptionType.String)(options)?.value
    if (!username) {
      const account = await getDatabase({ connectionString: env.DATABASE_URL }).accounts.find(
        discordUser.id
      )
      if (account === undefined) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            embeds: [getErrorEmbed('Set your RYM username with `/set username` then retry')],
          },
        }
      }
      username = account.rymUsername
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: `RYM username: ${username}` },
    }
  }
)
