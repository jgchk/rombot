import { either, option } from 'fp-ts'
import { UsageError } from '../errors'
import { setServerPrefix } from '../services/server'
import { Command } from '../types'

const prefix: Command = {
  name: 'prefix',
  description: 'set the bot prefix',
  usage: 'set PREFIX',
  examples: ['set !rym'],
  execute: (message) => async () => {
    const prefix: string | undefined = message.arguments_[0]
    if (prefix === undefined) return either.left(new UsageError())

    await setServerPrefix(message.message.guildId, prefix)
    return either.right(option.some(`Set prefix to ${prefix}`))
  },
}

export default prefix
