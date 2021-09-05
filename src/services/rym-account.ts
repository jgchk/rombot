import cheerio from 'cheerio'
import { either, taskEither } from 'fp-ts'
import { HTTPError } from 'got/dist/source'
import { MissingDataError, UsernameDoesntExistError } from '../errors'
import { makeUserUrl } from '../utils/links'
import { getRequestToken, gott, limiter } from '../utils/network'

export const follow =
  (
    username: string
  ): taskEither.TaskEither<MissingDataError | UsernameDoesntExistError, true> =>
  async () => {
    const maybeUserId = await getRymAccountId(username)()
    if (either.isLeft(maybeUserId)) return maybeUserId
    const userId = maybeUserId.right

    const maybeRequestToken = await getRequestToken()
    if (either.isLeft(maybeRequestToken)) return maybeRequestToken
    const requestToken = maybeRequestToken.right

    await limiter.schedule(() =>
      gott('https://rateyourmusic.com/httprequest/FollowFollowUser', {
        method: 'POST',
        form: {
          user_id: userId,
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
    username: string
  ): taskEither.TaskEither<MissingDataError | UsernameDoesntExistError, true> =>
  async () => {
    const maybeUserId = await getRymAccountId(username)()
    if (either.isLeft(maybeUserId)) return maybeUserId
    const userId = maybeUserId.right

    const maybeRequestToken = await getRequestToken()
    if (either.isLeft(maybeRequestToken)) return maybeRequestToken
    const requestToken = maybeRequestToken.right

    await limiter.schedule(() =>
      gott('https://rateyourmusic.com/httprequest/FollowUnfollowUser', {
        method: 'POST',
        form: {
          user_id: userId,
          action: 'FollowUnfollowUser',
          rym_ajax_req: 1,
          request_token: requestToken,
        },
      })
    )

    return either.right(true)
  }

export const getRymAccountId =
  (
    username: string
  ): taskEither.TaskEither<
    MissingDataError | UsernameDoesntExistError,
    string
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

      const id = /#(\d+)/.exec(text)?.[1]
      if (id === undefined)
        return either.left(
          new MissingDataError(`rym account id for ${username}`)
        )

      return either.right(id)
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        return either.left(new UsernameDoesntExistError(username))
      } else {
        throw error
      }
    }
  }
