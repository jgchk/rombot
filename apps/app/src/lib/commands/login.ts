import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'
import { getRedis } from 'redis'
import { login as login_ } from 'rym'

import { env } from '$lib/env'

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

    const result = await login_(fetch)({ username, password })
    if (result.isLoggedIn && result.cookies) {
      const redis = getRedis({ url: env.REDIS_URL, token: env.REDIS_TOKEN })
      await redis.setCookies(username, result.cookies)
    }

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: result.isLoggedIn ? 'Logged in!' : 'Failed to log in' },
    }
  }
)
