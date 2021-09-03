import { either, option } from 'fp-ts'
import { UsageError } from '../errors'
import { getUsernameForUser, setUsernameForUser } from '../services/account'
import { follow, unfollow } from '../services/rym-user'
import { Command } from '../types'

const set: Command = {
  name: 'set',
  description: 'set your rym username',
  usage: 'set USERNAME',
  examples: ['set ~sharifi'],
  execute: (message) => async () => {
    let username: string | undefined = message.arguments_[0]
    if (username === undefined) return either.left(new UsageError())
    if (username.startsWith('~')) username = username.slice(1)

    const currentUsername = await getUsernameForUser(message.message.author)
    if (currentUsername !== username) {
      if (currentUsername !== undefined) await unfollow(currentUsername)
      await setUsernameForUser(message.message.author, username)
      await follow(username)
    }

    return either.right(option.some(`Set username to ~${username}`))
  },
}

export default set
