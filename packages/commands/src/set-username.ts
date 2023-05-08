import { ApplicationCommandOptionType } from 'discord'

import { cmd } from './types'
import { getErrorEmbed, getOption } from './utils'

export const setUsername = cmd(
  {
    name: 'set',
    description: 'Set your RYM username',
    private: true,
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
  async (command, { db }) => {
    const {
      data: { options = [] },
    } = command

    const discordUser = command.user ?? command.member?.user
    if (!discordUser) {
      return {
        embeds: [getErrorEmbed('Could not extract user from command')],
      }
    }

    const subcommand = getOption('username', ApplicationCommandOptionType.Subcommand)(options)
    const username = getOption(
      'username',
      ApplicationCommandOptionType.String
    )(subcommand?.options ?? [])?.value

    if (!username) {
      return {
        content: 'You must provide a username',
      }
    }

    const account = await db.accounts.setRymUsername(discordUser.id, username)

    return {
      content: `Set your RYM username to ${account.rymUsername}`,
    }
  }
)
