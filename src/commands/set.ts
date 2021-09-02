import { left, right } from 'fp-ts/Either'
import { UsageError } from '../errors'
import { getUsernameForUser, setUsernameForUser } from '../services/account'
import { follow, unfollow } from '../services/rym-user'
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

    const currentUsername = await getUsernameForUser(message.message.author)
    if (currentUsername !== username) {
      if (currentUsername !== undefined) await unfollow(currentUsername)
      await setUsernameForUser(message.message.author, username)
      await follow(username)
    }

    return right(`Set username to ~${username}`)
  },
}

export default set
