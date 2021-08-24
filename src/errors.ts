import { userMention } from '@discordjs/builders'
import { User } from 'discord.js'
import { RequestError } from 'got'
import set from './commands/set'
import { PREFIX } from './config'
import { capitalize } from './utils/string'

export type AppError =
  | UsageError
  | UsernameNotFoundError
  | NoReleaseFoundError
  | MissingDataError
  | NoRatingsError
  | UsernameDoesntExistError
  | RequestError
  | RangeError

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
    super(
      `No username set for ${userMention(
        user.id
      )}\nYou can set your RYM username with \`${PREFIX}${set.name}\``
    )
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

export class UsernameDoesntExistError extends Error {
  name: 'UsernameDoesntExistError'
  username: string

  constructor(username: string) {
    super(`No account found for ~${username}`)
    this.name = 'UsernameDoesntExistError'
    this.username = username
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

export { RequestError } from 'got'
