import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { RangeError } from '../../errors'
import { getNLatestRatings } from '../../services/rating'
import { Command, CommandMessage } from '../../types'
import { getUsername } from '../../utils/arguments'
import { ifDefined } from '../../utils/functional'
import { getRecentEmbed } from './embed'

const DEFAULT_AMOUNT = 5
const MINIMUM_AMOUNT = 1
const MAXIMUM_AMOUNT = 10

const recent: Command = {
  name: 'recent',
  aliases: ['r'],
  description: 'shows your latest ratings',
  usage: 'latest [AMOUNT] [USER]',
  examples: [
    'r',
    'recent',
    'recent 10',
    'recent sharifi',
    'recent @user',
    'recent 5 sharifi',
    'recent 5 @user',
  ],
  execute: (message) => async () => {
    const { maybeUsername } = await getUsername(message)()
    if (either.isLeft(maybeUsername)) return maybeUsername
    const username = maybeUsername.right

    const maybeAmount = getAmount(message)
    if (either.isLeft(maybeAmount)) return maybeAmount
    const amount = maybeAmount.right

    const maybeReleaseRatings = await getNLatestRatings(username, amount)
    if (either.isLeft(maybeReleaseRatings)) return maybeReleaseRatings
    const releaseRatings = maybeReleaseRatings.right

    return either.right(
      option.some({
        embeds: [
          getRecentEmbed(releaseRatings, message.message.author, username),
        ],
      })
    )
  },
}

const getAmount = (
  message: CommandMessage
): either.Either<RangeError, number> => {
  const amount = pipe(
    message.arguments_.find((number) => !Number.isNaN(Number.parseInt(number))),
    ifDefined(parseInt)
  )

  if (amount === undefined) return either.right(DEFAULT_AMOUNT)

  if (amount < MINIMUM_AMOUNT || amount > MAXIMUM_AMOUNT)
    return either.left(new RangeError('amount', MINIMUM_AMOUNT, MAXIMUM_AMOUNT))

  return either.right(amount)
}

export default recent
