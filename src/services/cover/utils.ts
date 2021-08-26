import { isLeft } from 'fp-ts/Either'
import { Database } from '../../database'
import { Release } from '../../database/schemas/release'
import { gott, limiter } from '../../utils/network'
import { getLastFmImageUrl } from '../lastfm'
import { getReleaseFromUrl } from '../release'
import { CoverArgument } from './types'

export const getCachedCover = async (
  { issueUrl }: CoverArgument,
  database: Database
): Promise<Buffer | undefined> => {
  const databaseCover = await database.getCover({ issueUrl })
  return databaseCover?.image
}

export const getCoverFromCachedFullRelease = async (
  release: CoverArgument,
  database: Database
): Promise<{ cover: Buffer | undefined; fullRelease: Release | undefined }> => {
  const databaseRelease = await database.getRelease(release.issueUrl)

  let image: Buffer | undefined
  if (databaseRelease !== undefined && databaseRelease.cover !== null) {
    const databaseCover = await database.getCover({
      imageUrl: databaseRelease.cover,
    })

    if (databaseCover !== undefined) {
      image = databaseCover.image
    } else {
      const cover = databaseRelease.cover
      image = await limiter.schedule(() => gott(cover).buffer())
    }

    await database.setCover({
      issueUrl: release.issueUrl,
      imageUrl: databaseRelease.cover,
      image,
    })
  }

  return { cover: image, fullRelease: databaseRelease }
}

export const getCoverFromLastFm = async (
  release: CoverArgument,
  database: Database
): Promise<Buffer | undefined> => {
  const lastFmImageUrl = await getLastFmImageUrl(release)
  if (lastFmImageUrl !== undefined) {
    const databaseCover = await database.getCover({ imageUrl: lastFmImageUrl })
    const image = databaseCover?.image ?? (await gott(lastFmImageUrl).buffer())
    await database.setCover({
      issueUrl: release.issueUrl,
      imageUrl: lastFmImageUrl,
      image,
    })
    return image
  }
}

export const getCoverFromFetchedFullRelease = async (
  release: CoverArgument,
  database: Database
): Promise<Buffer | undefined> => {
  const maybeFullRelease = await getReleaseFromUrl(release.issueUrl)
  if (isLeft(maybeFullRelease)) return
  const fullRelease = maybeFullRelease.right
  if (fullRelease.cover === null) return

  const cachedCover = await database.getCover({ imageUrl: fullRelease.cover })
  if (cachedCover !== undefined) return cachedCover.image

  const cover = fullRelease.cover
  const image = await limiter.schedule(() => gott(cover).buffer())
  await database.setCover({
    issueUrl: release.issueUrl,
    imageUrl: fullRelease.cover,
    image,
  })
  return image
}
