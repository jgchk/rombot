import * as canvas from 'canvas'
import type { Canvas } from 'canvas'
import { FastAverageColor } from 'fast-average-color'
import { ifDefined, ifNotNull, isDark } from 'utils'
import type { Fetcher } from 'utils/browser'

import type { Artist, Rating, Release } from './types'

const { createCanvas, loadImage } = canvas

const ALBUM_SIZE = 300

const TITLE_CARD_MARGIN = {
  top: ALBUM_SIZE / 30,
  bottom: ALBUM_SIZE / 30,
  left: ALBUM_SIZE / 30,
  right: ALBUM_SIZE / 30,
}
const TITLE_CARD_PADDING = {
  top: ALBUM_SIZE / 30,
  bottom: (ALBUM_SIZE * 1.2) / 30,
  left: ALBUM_SIZE / 30,
  right: ALBUM_SIZE / 30,
}

const TITLE_CARD_MAX_INNER_WIDTH =
  ALBUM_SIZE -
  TITLE_CARD_MARGIN.left -
  TITLE_CARD_MARGIN.right -
  TITLE_CARD_PADDING.left -
  TITLE_CARD_PADDING.right

const TITLE_CARD_GAP = ALBUM_SIZE / 60

const TITLE_CARD_ROUNDING = Math.max(ALBUM_SIZE / 100, 1.5)

const TITLE_CARD_MIN_FONT_SIZE = 10
const TITLE_CARD_FONT_SIZE = Math.max(ALBUM_SIZE * (20 / 300), TITLE_CARD_MIN_FONT_SIZE)

const stringifyRating = (rating: number): string => {
  let output = ''
  for (let index = 1; index <= 5; index++) {
    if (index - rating <= 0) output += '★'
    else if (index - rating === 0.5) output += '½'
    else return output
  }
  return output
}

export const createChart =
  (fetch: Fetcher) => async (releaseRatings: { release: Release; rating: Rating }[]) => {
    const albumsPerSide = Math.ceil(Math.sqrt(releaseRatings.length))
    const size = albumsPerSide * ALBUM_SIZE
    const canvas = createCanvas(size, size)

    await Promise.all(
      [...releaseRatings.entries()].map(([index, releaseRating]) => {
        const row = Math.floor(index / albumsPerSide)
        const col = index % albumsPerSide
        return renderReleaseRating(fetch)(releaseRating, canvas, row, col)
      })
    )

    return canvas.toBuffer()
  }

const renderReleaseRating =
  (fetch: Fetcher) =>
  async (
    { release, rating }: { release: Release; rating: Rating },
    canvas: Canvas,
    row: number,
    col: number
  ): Promise<void> => {
    const x = col * ALBUM_SIZE
    const y = row * ALBUM_SIZE
    const { isDark } = await renderCover(fetch)(release, canvas, x, y)
    renderTitleCard({ release, rating }, canvas, x, y, isDark)
  }

const renderCover =
  (fetch: Fetcher) => async (release: Release, canvas: Canvas, x: number, y: number) => {
    const context = canvas.getContext('2d')

    if (release.cover === null) {
      // TODO: add not-found image
      context.fillStyle = '#606060'
      context.fillRect(x, y, ALBUM_SIZE, ALBUM_SIZE)
      return { isDark: true }
    }

    const coverBuffer = Buffer.from(await fetch(release.cover).then((res) => res.arrayBuffer()))

    const canvasImage = await loadImage(coverBuffer)
    context.drawImage(canvasImage, x, y, ALBUM_SIZE, ALBUM_SIZE)

    const data = context.getImageData(x, y, ALBUM_SIZE, ALBUM_SIZE)

    const fac = new FastAverageColor()
    const [r, g, b] = fac.getColorFromArray4(data.data)

    return { isDark: isDark(r, g, b) }
  }

const renderTitleCard = (
  releaseRating: { release: Release; rating: Rating },
  canvas: Canvas,
  x: number,
  y: number,
  isDark: boolean
) => {
  const context = canvas.getContext('2d')

  const { textColor, backgroundColor } = isDark
    ? { textColor: '#ffffff', backgroundColor: '#00000080' }
    : { textColor: '#000000', backgroundColor: '#ffffff80' }

  const artist = stringifyArtists(
    releaseRating.release.artists,
    releaseRating.release.artistDisplayName
  )
  const artistText = getFontForText(canvas, artist, { style: 'bold' })

  const title = releaseRating.release.title
  const titleText = getFontForText(canvas, title)

  const rating = ifNotNull(releaseRating.rating.rating, stringifyRating)
  const ratingText = ifNotNull(rating, (rating_) => getFontForText(canvas, rating_))

  const titleCardWidth =
    TITLE_CARD_PADDING.left +
    Math.max(artistText.width, titleText.width, ratingText?.width ?? 0) +
    TITLE_CARD_PADDING.right
  const titleCardHeight =
    TITLE_CARD_PADDING.top +
    artistText.height +
    TITLE_CARD_GAP +
    titleText.height +
    (ratingText !== null ? TITLE_CARD_GAP + ratingText.height : 0) +
    TITLE_CARD_PADDING.bottom

  const titleCardX = x + (ALBUM_SIZE - titleCardWidth) / 2
  const titleCardY = y + ALBUM_SIZE - TITLE_CARD_MARGIN.bottom - titleCardHeight

  context.fillStyle = backgroundColor
  // context.beginPath()
  // context.roundRect(titleCardX, titleCardY, titleCardWidth, titleCardHeight, TITLE_CARD_ROUNDING)
  // context.fill()
  context.fillRect(titleCardX, titleCardY, titleCardWidth, titleCardHeight)

  const artistX = titleCardX + (titleCardWidth - artistText.width) / 2
  const artistY = titleCardY + TITLE_CARD_PADDING.top + artistText.height
  context.font = artistText.font
  context.fillStyle = textColor
  context.fillText(artist, artistX, artistY, TITLE_CARD_MAX_INNER_WIDTH)

  const titleX = titleCardX + (titleCardWidth - titleText.width) / 2
  const titleY = artistY + TITLE_CARD_GAP + titleText.height
  context.font = titleText.font
  context.fillStyle = textColor
  context.fillText(title, titleX, titleY, TITLE_CARD_MAX_INNER_WIDTH)

  if (rating !== null && ratingText !== null) {
    const ratingX = titleCardX + (titleCardWidth - ratingText.width) / 2
    const ratingY = titleY + TITLE_CARD_GAP + ratingText.height
    context.font = ratingText.font
    context.fillStyle = textColor
    context.fillText(rating, ratingX, ratingY, TITLE_CARD_MAX_INNER_WIDTH)
  }
}

const getFontForText = (
  canvas: Canvas,
  text: string,
  {
    maxWidth = TITLE_CARD_MAX_INNER_WIDTH,
    baseFontSize = TITLE_CARD_FONT_SIZE,
    minimumFontSize = TITLE_CARD_MIN_FONT_SIZE,
    sizeStep = 1,
    style = '',
    fontTemplate = (size: number) =>
      (style ? `${style} ` : '') + `${size}px "Open Sans", "Segoe UI", Tahoma, sans-serif`,
  } = {}
): { font: string; height: number; width: number; metrics: TextMetrics } => {
  const context = canvas.getContext('2d')

  // Declare a base size of the font
  let fontSize = baseFontSize
  context.font = fontTemplate(fontSize)
  let metrics = context.measureText(text)

  while (metrics.width > maxWidth && fontSize > minimumFontSize) {
    fontSize -= sizeStep
    context.font = fontTemplate(fontSize)
    metrics = context.measureText(text)
  }

  return {
    font: context.font,
    height: fontSize,
    width: Math.min(metrics.width, maxWidth),
    metrics,
  }
}

const stringifyArtists = (artists: Artist[], displayName: string | null): string => {
  if (displayName !== null) return displayName
  if (artists.length === 1) return artists[0].name

  const finalArtist = ifDefined(artists.pop(), (a) => a.name)
  if (finalArtist === undefined) throw new Error('Collab has no artists')

  return `${artists.map((a) => a.name).join(', ')} & ${finalArtist}`
}
