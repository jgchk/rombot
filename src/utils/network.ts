import { URL } from 'url'
import Bottleneck from 'bottleneck'
import { either } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import got, {
  CancelableRequest,
  OptionsOfTextResponseBody,
  Response,
} from 'got'
import { CookieJar } from 'tough-cookie'
import { REQUEST_TIMEOUT } from '../config'
import { MissingDataError } from '../errors'
import { ifDefined } from './functional'

export const limiter = new Bottleneck({
  reservoir: 16,
  reservoirRefreshAmount: 16,
  reservoirRefreshInterval: 2 * 60 * 1000,
  maxConcurrent: 1,
  minTime: 1250,
})

export const cookieJar = new CookieJar()

const customGot = got.extend({
  timeout: REQUEST_TIMEOUT,
  cookieJar,
})

export const gott = (
  url: string | URL,
  options?: OptionsOfTextResponseBody
): CancelableRequest<Response<string>> => {
  console.log(url)
  return customGot(url, options)
}

export const getRequestToken = async (): Promise<
  either.Either<MissingDataError, string>
> => {
  const cookies = await cookieJar.getCookies('https://rateyourmusic.com')
  const ulv = pipe(
    cookies.find((cookie) => cookie.key === 'ulv'),
    ifDefined((cookie) => decodeURIComponent(cookie.value))
  )
  if (ulv === undefined)
    return either.left(new MissingDataError('request token'))
  return either.right(ulv)
}
