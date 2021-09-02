import { isLeft, left, right } from 'fp-ts/Either'
import { UsageError } from '../errors'
import { setUsernameForUser } from '../services/account'
import { follow } from '../services/rym-user'
import { Command } from '../types'

const set: Command = {
  name: 'set',
  description: 'set your rym username',
  usage: 'set USERNAME',
  examples: ['set ~sharifi'],
  execute: async (message) => {
    let username: string | undefined = message.arguments_[0]
    if (username === undefined) return left(new UsageError())
    if (username.startsWith('~')) username = username.slice(1)

    await setUsernameForUser(message.message.author, username)
    const result = await follow(username)
    if (isLeft(result)) return result

    return right(`Set username to ~${username}`)
  },
}

export default set
