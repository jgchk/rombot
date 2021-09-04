import { either, taskEither } from 'fp-ts'
import { RequestError } from 'got'
import getDatabase from '../../database'
import { Release } from '../../database/schemas/release'
import { MissingDataError, NoReleaseFoundError } from '../../errors'
import scrapeRelease, { getCombinedUrl } from './scraper'
import { getSearchResult, loadPage } from './utils'

export const searchRelease =
  (
    query: string
  ): taskEither.TaskEither<
    NoReleaseFoundError | MissingDataError | RequestError,
    Release
  > =>
  async () => {
    const database = await getDatabase()()
    const cachedSearchResult = await database.getSearchResult(query)

    if (cachedSearchResult !== undefined) {
      const url = cachedSearchResult.url
      const cachedRelease = await database.getCombinedRelease(url)
      if (cachedRelease !== undefined) return either.right(cachedRelease)

      return getCombinedReleaseFromUrl(url)
    }

    const maybeSearchReleaseUrl = await getSearchResult(query)
    if (maybeSearchReleaseUrl === undefined)
      return either.left(new NoReleaseFoundError())
    const searchResultUrl = maybeSearchReleaseUrl.replace(/\/buy\/$/, '/')

    const maybeRelease = await getCombinedReleaseFromUrl(searchResultUrl)
    if (either.isLeft(maybeRelease)) return maybeRelease

    await database.setSearchResult({
      query,
      url: maybeRelease.right.combinedUrl,
    })
    return maybeRelease
  }

export const getReleaseFromUrl =
  (
    url: string
  ): taskEither.TaskEither<RequestError | MissingDataError, Release> =>
  async () => {
    const database = await getDatabase()()
    const cachedRelease = await database.getRelease(url)
    if (cachedRelease !== undefined) return either.right(cachedRelease)

    const $ = await loadPage(url)

    const maybeRelease = scrapeRelease($, url)
    if (either.isLeft(maybeRelease)) return maybeRelease

    await database.setRelease(maybeRelease.right)
    return maybeRelease
  }

export const getCombinedReleaseFromUrl = async (
  issueUrl: string
): Promise<either.Either<MissingDataError | RequestError, Release>> => {
  const database = await getDatabase()()
  const cachedRelease = await database.getCombinedRelease(issueUrl)
  if (cachedRelease !== undefined) return either.right(cachedRelease)

  let url = issueUrl
  let $ = await loadPage(url)

  const combinedUrl = getCombinedUrl($)

  if (combinedUrl !== undefined && combinedUrl !== url) {
    // on subissue page. try to store it in db but don't worry if we error
    const maybeIssue = scrapeRelease($, url)
    if (either.isRight(maybeIssue)) {
      await database.setRelease(maybeIssue.right)
    }

    // now load up the combined issue page
    url = combinedUrl
    $ = await loadPage(combinedUrl)
  }

  const maybeRelease = scrapeRelease($, url)
  if (either.isLeft(maybeRelease)) return maybeRelease

  await database.setRelease(maybeRelease.right)
  return maybeRelease
}
