import { left, right } from 'fp-ts/Either'
import { UsageError } from '../errors'
import { setServerPrefix } from '../services/server'
import { Command } from '../types'

const prefix: Command = {
  name: 'prefix',
  description: 'set the bot prefix',
  usage: 'set PREFIX',
  examples: ['set !rym'],
  execute: async (message) => {
    const prefix: string | undefined = message.arguments_[0]
    if (prefix === undefined) return left(new UsageError())

    await setServerPrefix(message.message.guildId, prefix)
    return right(`Set prefix to ${prefix}`)
  },
}

export default prefix
