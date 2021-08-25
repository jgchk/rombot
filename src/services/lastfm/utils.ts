import { Album, ErrorResponse, Size, SuccessResponse } from './types'

export const isErrorResponse = (
  response: SuccessResponse | ErrorResponse
): response is ErrorResponse => 'error' in response

export const getAlbumImage = (album: Album): string | undefined => {
  const images = album.image.sort((a, b) => -compareSizes(a.size, b.size))
  for (const image of images) {
    const url = image['#text'] || undefined
    if (url !== undefined) return url
  }
}

const compareSizes = (a: Size, b: Size): number => {
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
