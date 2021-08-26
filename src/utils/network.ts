import { URL } from 'url'
import Bottleneck from 'bottleneck'
import got, {
  CancelableRequest,
  OptionsOfTextResponseBody,
  Response,
} from 'got'
import { CookieJar } from 'tough-cookie'
import { REQUEST_TIMEOUT } from '../config'

export const limiter = new Bottleneck({
  reservoir: 10,
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 1,
  minTime: 1000,
})

const customGot = got.extend({
  timeout: REQUEST_TIMEOUT,
  cookieJar: new CookieJar(),
})

export const gott = (
  url: string | URL,
  options?: OptionsOfTextResponseBody
): CancelableRequest<Response<string>> => {
  console.log(url)
  return customGot(url, options)
}
