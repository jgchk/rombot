import { MessageAttachment } from 'discord.js'
import { Either, isLeft, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { compareFullDates } from '../../database/schemas/full-date'
import { RangeError } from '../../errors'
import { getLatestRatings } from '../../services/rating'
import { Command, CommandMessage } from '../../types'
import { getUsername } from '../../utils/arguments'
import { ifDefined } from '../../utils/functional'
import { createChart } from './image'

const DEFAULT_SIZE = 3
const MINIMUM_SIZE = 1
const MAXIMUM_SIZE = 5

const chart: Command = {
  name: 'chart',
  aliases: ['c'],
  description: 'creates a chart of your top albums out of your last 25 ratings',
  usage: 'c [SIZE] [USER] [lowest|l]',
  examples: [
    'c',
    'chart 3x3',
    'chart ~sharifi',
    'chart @user',
    'chart 5x5 ~sharifi',
    'chart 5x5 @user',
    'chart lowest',
  ],
  execute: async (message) => {
    const { maybeUsername } = await getUsername(message)
    if (isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const invertOrder = message.arguments_.some(
      (argument) => argument === 'lowest' || argument === 'l'
    )

    const maybeSize = getSize(message)
    if (isLeft(maybeSize)) return maybeSize
    const size = maybeSize.right

    const maybeReleaseRatings = await getLatestRatings(username)
    if (isLeft(maybeReleaseRatings)) return maybeReleaseRatings
    const releaseRatings = maybeReleaseRatings.right
      .sort(
        (a, b) =>
          (invertOrder ? 1 : -1) *
            ((a.rating.rating ?? 0) - (b.rating.rating ?? 0)) ||
          -compareFullDates(a.rating.date, b.rating.date)
      )
      .slice(0, size * size)

    const chart = await createChart(releaseRatings)
    const attachment = new MessageAttachment(
      chart.toBuffer(),
      `chart-${username}-${size}x${size}-${Date.now()}.png`
    )
    return right({ files: [attachment] })
  },
}

const getSize = (message: CommandMessage): Either<RangeError, number> => {
  const size = pipe(
    message.arguments_.find((number) => !Number.isNaN(Number.parseInt(number))),
    ifDefined(parseInt)
  )

  if (size === undefined) return right(DEFAULT_SIZE)

  if (size < MINIMUM_SIZE || size > MAXIMUM_SIZE)
    return left(
      new RangeError(
        'size',
        `${MINIMUM_SIZE}x${MINIMUM_SIZE}`,
        `${MAXIMUM_SIZE}x${MAXIMUM_SIZE}`
      )
    )

  return right(size)
}

export default chart
