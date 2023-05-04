import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'
import { login as login_ } from 'rym'

import { cmd } from './types'
import { getOption } from './utils'

export const login = cmd(
  {
    name: 'login',
    description: 'Logs in to RYM',
    options: [
      {
        name: 'username',
        description: 'Your RYM username',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'password',
        description: 'Your RYM password',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  async ({ data: { options = [] } }, { fetch }) => {
    const username = getOption('username', ApplicationCommandOptionType.String)(options)?.value
    const password = getOption('password', ApplicationCommandOptionType.String)(options)?.value

    if (!username) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: 'You must provide a username' },
      }
    }
    if (!password) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: 'You must provide a password' },
      }
    }

    const isLoggedIn = await login_(fetch)({ username, password })

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: isLoggedIn ? 'Logged in!' : 'Failed to log in' },
    }
  }
)
