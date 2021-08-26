import { LASTFM_KEY, REQUEST_TIMEOUT } from '../../config'
import { PartialRelease } from '../../database/schemas/partial-release'
import { gott } from '../../utils/network'
import { stringifyArtists } from '../../utils/render'
import { ErrorResponse, SuccessResponse } from './types'
import { getAlbumImage, isErrorResponse } from './utils'

export const getLastFmImageUrl = async ({
  artists,
  artistDisplayName,
  title,
}: Pick<PartialRelease, 'artists' | 'artistDisplayName' | 'title'>): Promise<
  string | undefined
> => {
  if (LASTFM_KEY === undefined) return

  const query = `${stringifyArtists(artists, artistDisplayName, {
    links: false,
  })} ${title}`

  const response = await gott('http://ws.audioscrobbler.com/2.0/', {
    searchParams: {
      method: 'album.search',
      album: query,
      api_key: LASTFM_KEY,
      format: 'json',
    },
    timeout: REQUEST_TIMEOUT,
  }).json<SuccessResponse | ErrorResponse>()
  if (isErrorResponse(response)) return

  const albums = response.results.albummatches.album
  for (const album of albums) {
    const image = getAlbumImage(album)
    if (image !== undefined) return image
  }
}
