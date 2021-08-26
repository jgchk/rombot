import cheerio, { CheerioAPI } from 'cheerio'
import * as ddg from 'duck-duck-scrape'
import { pipe } from 'fp-ts/function'
import { ifDefined } from '../../utils/functional'
import { makeRymUrl } from '../../utils/links'
import { gott, limiter } from '../../utils/network'

export const loadPage = async (url: string): Promise<CheerioAPI> => {
  const response = await limiter.schedule(() => gott(url))
  return cheerio.load(response.body)
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
