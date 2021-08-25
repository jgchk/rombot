import got from 'got'
import { LASTFM_KEY, REQUEST_TIMEOUT } from '../../config'
import { PartialRelease } from '../../database/schemas/partial-release'
import { stringifyArtists } from '../../utils/render'

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

  const response = await got('http://ws.audioscrobbler.com/2.0/', {
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

const getAlbumImage = (album: Album): string | undefined => {
  const images = album.image.sort((a, b) => -compareSizes(a.size, b.size))
  for (const image of images) {
    const url = image['#text'] || undefined
    if (url !== undefined) return url
  }
}

//
//
// TYPES
//

export interface SuccessResponse {
  results: Results
}

export interface ErrorResponse {
  error: number
  message: string
}

export const isErrorResponse = (
  response: SuccessResponse | ErrorResponse
): response is ErrorResponse => 'error' in response

export interface Results {
  'opensearch:Query': OpenSearchQuery
  'opensearch:totalResults': string
  'opensearch:startIndex': string
  'opensearch:itemsPerPage': string
  albummatches: AlbumMatches
  '@attr': Attribute
}

export interface Attribute {
  for: string
}

export interface AlbumMatches {
  album: Album[]
}

export interface Album {
  name: string
  artist: string
  url: string
  image: Image[]
  streamable: string
  mbid: string
}

export interface Image {
  '#text': string
  size: Size
}

export enum Size {
  ExtraLarge = 'extralarge',
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
}

export const compareSizes = (a: Size, b: Size): number => {
  if (a === b) return 0
  if (a === Size.ExtraLarge) return 1
  if (b === Size.ExtraLarge) return -1
  if (a === Size.Large) return 1
  if (b === Size.Large) return -1
  if (a === Size.Medium) return 1
  if (b === Size.Medium) return -1
  if (a === Size.Small) return 1
  if (b === Size.Small) return -1
  return 0
}

export interface OpenSearchQuery {
  '#text': string
  role: string
  searchTerms: string
  startPage: string
}
