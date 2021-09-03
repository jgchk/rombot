import { MessageAttachment } from 'discord.js'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { compareFullDates } from '../../database/schemas/full-date'
import { RangeError } from '../../errors'
import { getNLatestRatings, getNTopRatings } from '../../services/rating'
import { Command, CommandMessage } from '../../types'
import { getUsername } from '../../utils/arguments'
import { ifDefined } from '../../utils/functional'
import { getChartEmbed } from './embed'
import { createChart } from './image'
import { Amount } from './types'

const DEFAULT_SIZE = 3
const MINIMUM_SIZE = 1
const MAXIMUM_SIZE = 5

const DEFAULT_NUMBER_RATINGS = 25
const MINIMUM_NUMBER_RATINGS = 1
const MAXIMUM_NUMBER_RATINGS = 50

const chart: Command = {
  name: 'chart',
  aliases: ['c'],
  description:
    'creates a chart of your top albums out of your last n ratings (up to 50)',
  usage: 'c [SIZE] [USER] [NUMBER_RATINGS] [lowest|l|bottom|b]',
  examples: [
    'c',
    'chart 3x3',
    'chart ~sharifi',
    'chart @user',
    'chart 5x5 ~sharifi',
    'chart 5x5 @user',
    'chart lowest',
  ],
  execute: (message) => async () => {
    const { maybeUsername } = await getUsername(message)()
    if (either.isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const maybeSize = getSize(message)
    if (either.isLeft(maybeSize)) return maybeSize
    const size = maybeSize.right

    const maybeAmount = getAmount(message, size)
    if (either.isLeft(maybeAmount)) return maybeAmount
    const amount = maybeAmount.right

    const invertOrder = message.arguments_
      .map((argument) => argument.trim().toLowerCase())
      .some(
        (argument) =>
          argument === 'lowest' ||
          argument === 'l' ||
          argument === 'bottom' ||
          argument === 'b'
      )

    const maybeReleaseRatings =
      amount === 'alltime'
        ? await getNTopRatings(username, size * size, invertOrder)
        : await getNLatestRatings(username, amount)
    if (either.isLeft(maybeReleaseRatings)) return maybeReleaseRatings
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
    const embed = getChartEmbed(
      size,
      amount,
      invertOrder,
      message.message.author,
      username
    )
    return either.right(option.some({ files: [attachment], embeds: [embed] }))
  },
}

const getSize = (
  message: CommandMessage
): either.Either<RangeError, number> => {
  const size = pipe(
    message.arguments_.find((argument) => /^\d+x\d+$/.test(argument)),
    ifDefined(parseInt)
  )

  if (size === undefined) return either.right(DEFAULT_SIZE)

  if (size < MINIMUM_SIZE || size > MAXIMUM_SIZE)
    return either.left(
      new RangeError(
        'size',
        `${MINIMUM_SIZE}x${MINIMUM_SIZE}`,
        `${MAXIMUM_SIZE}x${MAXIMUM_SIZE}`
      )
    )

  return either.right(size)
}

const getAmount = (
  message: CommandMessage,
  size: number
): either.Either<RangeError, Amount> => {
  const allTime = message.arguments_
    .map((argument) => argument.trim().toLowerCase())
    .some(
      (argument) =>
        argument === 'alltime' || argument === 'a' || argument === 'overall'
    )
  if (allTime) return either.right('alltime')

  const numberRatings = pipe(
    message.arguments_.find((argument) => /^\d+$/.test(argument)),
    ifDefined(parseInt)
  )

  if (numberRatings === undefined) return either.right(DEFAULT_NUMBER_RATINGS)

  const minimum = Math.max(MINIMUM_NUMBER_RATINGS, size * size)
  if (numberRatings < minimum || numberRatings > MAXIMUM_NUMBER_RATINGS)
    return either.left(
      new RangeError(
        `number of ratings for ${size}x${size} chart`,
        minimum,
        MAXIMUM_NUMBER_RATINGS
      )
    )

  return either.right(numberRatings)
}

export default chart
