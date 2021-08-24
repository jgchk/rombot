import cheerio, { CheerioAPI } from 'cheerio'
import * as ddg from 'duck-duck-scrape'
import { Either, isLeft, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { RequestError } from '../../errors'
import network from '../../network'
import { ifDefined } from '../../utils/functional'
import { makeRymUrl } from '../../utils/links'

export const loadPage = async (
  url: string
): Promise<Either<RequestError, CheerioAPI>> => {
  const maybeResponse = await network.get(url)
  if (isLeft(maybeResponse)) return maybeResponse
  return right(cheerio.load(maybeResponse.right.body))
}

export const getSearchResult = async (
  query: string
): Promise<string | undefined> => {
  const response = await ddg.search(`site:rateyourmusic.com/release ${query}`)
  return pipe(
    response.results.find(({ url }) =>
      new URL(url).hostname.includes('rateyourmusic.com')
    ),
    ifDefined((result) => makeRymUrl(new URL(makeRymUrl(result.url)).pathname))
  )
}
