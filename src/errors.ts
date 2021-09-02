import { userMention } from '@discordjs/builders'
import Bottleneck from 'bottleneck'
import { User } from 'discord.js'
import { RequestError } from 'got'
import { capitalize } from './utils/string'

export type AppError =
  | UsageError
  | UsernameNotFoundError
  | NoReleaseFoundError
  | MissingDataError
  | NoRatingsError
  | RequestError
  | RangeError
  | NotInServerError
  | Bottleneck.BottleneckError
  | InvalidCredentialsError
  | UsernameDoesntExistError
  | FollowError

export class UsageError extends Error {
  name: 'UsageError'

  constructor() {
    super('Incorrect command usage')
    this.name = 'UsageError'
  }
}

export class UsernameNotFoundError extends Error {
  name: 'UsernameNotFoundError'
  user: User

  constructor(user: User) {
    super(`No username set for ${userMention(user.id)}`)
    this.name = 'UsernameNotFoundError'
    this.user = user
  }
}

export class NoReleaseFoundError extends Error {
  name: 'NoReleaseFoundError'

  constructor() {
    super('No release found')
    this.name = 'NoReleaseFoundError'
  }
}

export class MissingDataError extends Error {
  name: 'MissingDataError'

  constructor(missingData: string) {
    super(`Error fetching data :(\nCould not find ${missingData}`)
    this.name = 'MissingDataError'
  }
}

export class NoRatingsError extends Error {
  name: 'NoRatingsError'

  constructor(username: string) {
    super(`~${username} has no ratings :(`)
    this.name = 'NoRatingsError'
  }
}

export class RangeError extends Error {
  name: 'RangeError'
  minimum: string | number
  maximum: string | number

  constructor(
    name: string,
    minimum: string | number,
    maximum: string | number
  ) {
    super(capitalize(`${name} must be between ${minimum} and ${maximum}`))
    this.minimum = minimum
    this.maximum = maximum
    this.name = 'RangeError'
  }
}

export class NotInServerError extends Error {
  name: 'NotInServerError'

  constructor() {
    super('Not in a server')
    this.name = 'NotInServerError'
  }
}

export class InvalidCredentialsError extends Error {
  name: 'InvalidCredentialsError'

  constructor() {
    super('Invalid credentials')
    this.name = 'InvalidCredentialsError'
  }
}

export class UsernameDoesntExistError extends Error {
  name: 'UsernameDoesntExistError'

  constructor(username: string) {
    super(`No account found with username ${username}`)
    this.name = 'UsernameDoesntExistError'
  }
}

export class FollowError extends Error {
  name: 'FollowError'

  constructor(type: 'followed' | 'unfollowed', username: string) {
    super(`Already ${type} ${username}`)
    this.name = 'FollowError'
  }
}

export { RequestError } from 'got'
