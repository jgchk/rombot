import getDatabase from '../../database'
import { CoverArgument } from './types'
import {
  getCachedCover,
  getCoverFromCachedFullRelease,
  getCoverFromFetchedFullRelease,
  getCoverFromLastFm,
} from './utils'

// tries last.fm before full fetch from rym
export const getFastCover = async (
  release: CoverArgument
): Promise<Buffer | undefined> => {
  const database = await getDatabase()()

  const cachedCover = await getCachedCover(release, database)
  if (cachedCover !== undefined) return cachedCover

  const { fullRelease, cover } = await getCoverFromCachedFullRelease(
    release,
    database
  )
  if (cover !== undefined) return cover

  const lastFmCover = await getCoverFromLastFm(release, database)
  if (lastFmCover !== undefined) return lastFmCover

  // if we already have the album stored but it doesn't have a cover, return undefined
  if (fullRelease !== undefined && fullRelease.cover === null) return
  const fetchedCover = await getCoverFromFetchedFullRelease(release, database)
  if (fetchedCover !== undefined) return fetchedCover
}

// tries full fetch from rym before last.fm
export const getSlowCover = async (
  release: CoverArgument
): Promise<Buffer | undefined> => {
  const database = await getDatabase()()

  const cachedCover = await getCachedCover(release, database)
  if (cachedCover !== undefined) return cachedCover

  const { fullRelease, cover } = await getCoverFromCachedFullRelease(
    release,
    database
  )
  if (cover !== undefined) return cover

  // if we already have the album stored but it doesn't have a cover, return undefined
  if (fullRelease !== undefined && fullRelease.cover === null) return
  const fetchedCover = await getCoverFromFetchedFullRelease(release, database)
  if (fetchedCover !== undefined) return fetchedCover

  const lastFmCover = await getCoverFromLastFm(release, database)
  if (lastFmCover !== undefined) return lastFmCover
}
