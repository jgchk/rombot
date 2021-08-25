import { isLeft, isRight } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import got from 'got'
import { REQUEST_TIMEOUT } from '../../config'
import { Database } from '../../database'
import { Release } from '../../database/schemas/release'
import network from '../../network'
import { ifDefined } from '../../utils/functional'
import { getRight } from '../../utils/types'
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

    image =
      databaseCover?.image ??
      pipe(
        await network.get(databaseRelease.cover),
        getRight,
        ifDefined((response) => response.rawBody)
      )
    if (image !== undefined) {
      await database.setCover({
        issueUrl: release.issueUrl,
        imageUrl: databaseRelease.cover,
        image,
      })
    }
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
    console.log(lastFmImageUrl)
    const image =
      databaseCover?.image ??
      (await got(lastFmImageUrl, { timeout: REQUEST_TIMEOUT }).buffer())
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

  const maybeResponse = await network.get(fullRelease.cover)
  if (isRight(maybeResponse)) {
    const image = maybeResponse.right.rawBody
    await database.setCover({
      issueUrl: release.issueUrl,
      imageUrl: fullRelease.cover,
      image,
    })
    return image
  }
}
