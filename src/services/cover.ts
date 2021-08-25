import { isLeft, isRight } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import got from 'got'
import { getLastFmImageUrl } from '../commands/chart/lastfm'
import { REQUEST_TIMEOUT } from '../config'
import getDatabase from '../database'
import { PartialRelease } from '../database/schemas/partial-release'
import network from '../network'
import { ifDefined } from '../utils/functional'
import { getRight } from '../utils/types'
import { getReleaseFromUrl } from './release'

export const getCover = async (
  release: Pick<
    PartialRelease,
    'artists' | 'artistDisplayName' | 'title' | 'issueUrl'
  >
): Promise<Buffer | undefined> => {
  const database = await getDatabase()
  let databaseCover = await database.getCover({ issueUrl: release.issueUrl })
  if (databaseCover !== undefined) return databaseCover.image

  const databaseRelease = await database.getRelease(release.issueUrl)
  if (databaseRelease !== undefined && databaseRelease.cover !== null) {
    const databaseCover = await database.getCover({
      imageUrl: databaseRelease.cover,
    })

    const image =
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
      return image
    }
  }

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

  // if we already have the album stored but it doesn't have a cover, return undefined
  if (databaseRelease !== undefined) return

  const maybeFullRelease = await getReleaseFromUrl(release.issueUrl)
  if (isLeft(maybeFullRelease)) return
  const fullRelease = maybeFullRelease.right
  if (fullRelease.cover === null) return

  databaseCover = await database.getCover({ imageUrl: fullRelease.cover })
  if (databaseCover !== undefined) return databaseCover.image

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
