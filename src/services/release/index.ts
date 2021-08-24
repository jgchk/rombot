import { Either, isLeft, isRight, left, right } from 'fp-ts/Either'
import { RequestError } from 'got/dist/source'
import getDatabase from '../../database'
import { Release } from '../../database/schemas/release'
import { MissingDataError, NoReleaseFoundError } from '../../errors'
import scrapeRelease, { getCombinedUrl } from './scraper'
import { getSearchResult, loadPage } from './utils'

export const searchRelease = async (
  query: string
): Promise<
  Either<NoReleaseFoundError | MissingDataError | RequestError, Release>
> => {
  const database = await getDatabase()
  const cachedSearchResult = await database.getSearchResult(query)

  if (cachedSearchResult !== undefined) {
    const url = cachedSearchResult.url
    const cachedRelease = await database.getCombinedRelease(url)
    if (cachedRelease !== undefined) return right(cachedRelease)

    return getCombinedReleaseFromUrl(url)
  }

  const searchResultUrl = await getSearchResult(query)
  if (searchResultUrl === undefined) return left(new NoReleaseFoundError())

  const maybeRelease = await getCombinedReleaseFromUrl(searchResultUrl)
  if (isLeft(maybeRelease)) return maybeRelease

  await database.setSearchResult({ query, url: maybeRelease.right.combinedUrl })
  return maybeRelease
}

export const getReleaseFromUrl = async (
  url: string
): Promise<Either<RequestError | MissingDataError, Release>> => {
  const database = await getDatabase()
  const cachedRelease = await database.getRelease(url)
  if (cachedRelease !== undefined) return right(cachedRelease)

  const maybe$ = await loadPage(url)
  if (isLeft(maybe$)) return maybe$
  const $ = maybe$.right

  const maybeRelease = scrapeRelease($, url)
  if (isLeft(maybeRelease)) return maybeRelease

  await database.setRelease(maybeRelease.right)
  return maybeRelease
}

export const getCombinedReleaseFromUrl = async (
  issueUrl: string
): Promise<Either<MissingDataError | RequestError, Release>> => {
  const database = await getDatabase()
  const cachedRelease = await database.getCombinedRelease(issueUrl)
  if (cachedRelease !== undefined) return right(cachedRelease)

  let url = issueUrl
  let maybe$ = await loadPage(url)
  if (isLeft(maybe$)) return maybe$
  let $ = maybe$.right

  const combinedUrl = getCombinedUrl($)

  if (combinedUrl !== undefined && combinedUrl !== url) {
    // on subissue page. try to store it in db but don't worry if we error
    const maybeIssue = scrapeRelease($, url)
    if (isRight(maybeIssue)) {
      await database.setRelease(maybeIssue.right)
    }

    // now load up the combined issue page
    url = combinedUrl
    maybe$ = await loadPage(combinedUrl)
    if (isLeft(maybe$)) return maybe$
    $ = maybe$.right
  }

  const maybeRelease = scrapeRelease($, url)
  if (isLeft(maybeRelease)) return maybeRelease

  await database.setRelease(maybeRelease.right)
  return maybeRelease
}
