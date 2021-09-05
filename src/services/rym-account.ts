import cheerio from 'cheerio'
import { either, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { HTTPError } from 'got'
import getDatabase from '../database'
import { RymAccount } from '../database/schemas/rym-account'
import { MissingDataError, UsernameDoesntExistError } from '../errors'
import { makeUserUrl } from '../utils/links'
import { getRequestToken, gott, limiter } from '../utils/network'

export const follow =
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

export const unfollow =
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
