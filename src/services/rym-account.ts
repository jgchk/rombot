import cheerio from 'cheerio'
import { apply, array, either, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { HTTPError } from 'got'
import getDatabase from '../database'
import { RymAccount } from '../database/schemas/rym-account'
import { MissingDataError, UsernameDoesntExistError } from '../errors'
import { makeUserUrl } from '../utils/links'
import { getRequestToken, gott, limiter } from '../utils/network'
import { isDefined } from '../utils/types'

export const followByUsername = (
  username: string
): taskEither.TaskEither<MissingDataError | UsernameDoesntExistError, true> =>
  pipe(
    getRymAccount(username),
    taskEither.chain((rymAccount) => followByAccountId(rymAccount.accountId))
  )

export const followByAccountId =
  (
    accountId: string
  ): taskEither.TaskEither<MissingDataError | UsernameDoesntExistError, true> =>
  async () => {
    const maybeRequestToken = await getRequestToken()
    if (either.isLeft(maybeRequestToken)) return maybeRequestToken
    const requestToken = maybeRequestToken.right

    await limiter.schedule(() =>
      gott('https://rateyourmusic.com/httprequest/FollowFollowUser', {
        method: 'POST',
        form: {
          user_id: accountId,
          action: 'FollowFollowUser',
          rym_ajax_req: 1,
          request_token: requestToken,
        },
      })
    )

    return either.right(true)
  }

export const unfollowByUsername = (
  username: string
): taskEither.TaskEither<MissingDataError | UsernameDoesntExistError, true> =>
  pipe(
    getRymAccount(username),
    taskEither.chain((rymAccount) => unfollowByAccountId(rymAccount.accountId))
  )

export const unfollowByAccountId =
  (
    accountId: string
  ): taskEither.TaskEither<MissingDataError | UsernameDoesntExistError, true> =>
  async () => {
    const maybeRequestToken = await getRequestToken()
    if (either.isLeft(maybeRequestToken)) return maybeRequestToken
    const requestToken = maybeRequestToken.right

    await limiter.schedule(() =>
      gott('https://rateyourmusic.com/httprequest/FollowUnfollowUser', {
        method: 'POST',
        form: {
          user_id: accountId,
          action: 'FollowUnfollowUser',
          rym_ajax_req: 1,
          request_token: requestToken,
        },
      })
    )

    return either.right(true)
  }

// gets rym account from database, or fetches if it doesn't exist
export const getRymAccount = (
  username: string
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError,
  RymAccount
> =>
  pipe(
    getDatabase(),
    task.chain((database) => database.getRymAccount(username)),
    task.chain(
      option.fold(
        () => fetchRymAccountAndStoreInDatabase(username),
        (rymAccount) => task.of(either.right(rymAccount))
      )
    )
  )

const fetchRymAccountAndStoreInDatabase = (
  username: string
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError,
  RymAccount
> =>
  pipe(
    fetchRymAccount(username),
    taskEither.chain((rymAccount) =>
      taskEither.fromTask(
        pipe(
          getDatabase(),
          task.chain((database) => database.setRymAccount(rymAccount))
        )
      )
    )
  )

const fetchRymAccount =
  (
    username: string
  ): taskEither.TaskEither<
    MissingDataError | UsernameDoesntExistError,
    RymAccount
  > =>
  async () => {
    try {
      const response = await limiter.schedule(() => gott(makeUserUrl(username)))
      const $ = cheerio.load(response.body)
      const text = $('.profile_header').text() || undefined
      if (text === undefined)
        return either.left(
          new MissingDataError(`rym account id for ${username}`)
        )

      const accountId = /#(\d+)/.exec(text)?.[1]
      if (accountId === undefined)
        return either.left(
          new MissingDataError(`rym account id for ${username}`)
        )

      const realUsername = $('#profilename').text() || undefined
      if (realUsername === undefined)
        return either.left(
          new MissingDataError(`rym account username for ${username}`)
        )

      return either.right({ accountId, username: realUsername })
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        return either.left(new UsernameDoesntExistError(username))
      } else {
        throw error
      }
    }
  }

export const correctFollows = (
  username: string
): taskEither.TaskEither<
  MissingDataError | UsernameDoesntExistError,
  [readonly true[], readonly true[]]
> =>
  pipe(
    getFollowModificiations(username),
    task.chain(({ shouldBeFollowing, shouldNotBeFollowing }) =>
      apply.sequenceT(taskEither.ApplySeq)(
        pipe(
          shouldBeFollowing,
          array.map((username) => followByUsername(username)),
          taskEither.sequenceArray
        ),
        pipe(
          shouldNotBeFollowing,
          array.map((username) => unfollowByUsername(username)),
          taskEither.sequenceArray
        )
      )
    )
  )

// should be following list = all DiscordUser rymUsernames not in follow list
// should not be following list = all follow list usernames not in DiscordUser rymUsernames
const getFollowModificiations = (
  username: string
): task.Task<{
  shouldBeFollowing: string[]
  shouldNotBeFollowing: string[]
}> =>
  pipe(
    getFollows(username),
    task.chain((followList) =>
      pipe(
        getAllDiscordUserRymUsernames(),
        task.map((rymUsernames) => {
          const shouldBeFollowing = rymUsernames.filter(
            (username) => !followList.includes(username)
          )
          const shouldNotBeFollowing = followList.filter(
            (username) => !rymUsernames.includes(username)
          )
          return { shouldBeFollowing, shouldNotBeFollowing }
        })
      )
    )
  )

const getFollows =
  (username: string): task.Task<string[]> =>
  async () => {
    const response = await limiter.schedule(() =>
      gott(`https://rateyourmusic.com/friends/${username}/`)
    )
    const $ = cheerio.load(response.body)

    const usernames = $('.card_link a')
      .toArray()
      .map((element) => $(element).text() || undefined)
      .filter(isDefined)
    return usernames
  }

const getAllDiscordUserRymUsernames = (): task.Task<string[]> =>
  pipe(
    getDatabase(),
    task.chain((database) => database.getAllDiscordUsers()),
    task.map((discordUsers) =>
      pipe(
        discordUsers,
        array.filterMap((discordUser) =>
          option.fromNullable(discordUser.rymUsername)
        )
      )
    )
  )
