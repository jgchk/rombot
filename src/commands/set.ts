import { User } from 'discord.js'
import { apply, either, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
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

    const user = message.message.author
    await unfollowCurrentUsername(user)()
    await followAndSetUsername(username, user)()

    return either.right(option.some(`Set username to ~${username}`))
  },
}

const unfollowCurrentUsername = (user: User) =>
  pipe(
    getUsernameForUser(user),
    taskEither.chainW((currentUsername) => unfollow(currentUsername))
  )

const followAndSetUsername = (username: string, user: User) =>
  apply.sequenceT(task.ApplySeq)(
    setUsernameForUser(user, username),
    follow(username)
  )

export default set
