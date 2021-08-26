import path from 'path'
import Canvas, { registerFont } from 'canvas'
import { getAverageColor } from 'fast-average-color-node'
import { pipe } from 'fp-ts/function'
import { PartialRelease } from '../../database/schemas/partial-release'
import { getSlowCover } from '../../services/cover'
import { ReleaseRating } from '../../services/rating/utils'
import { ifNotNull } from '../../utils/functional'
import { stringifyArtists, stringifyRating } from '../../utils/render'

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

export const createChart = async (
  releaseRatings: ReleaseRating[]
): Promise<Canvas.Canvas> => {
  registerFont(path.join(__dirname, '../../../res/OpenSans-Regular.ttf'), {
    family: 'Open Sans',
  })
  registerFont(path.join(__dirname, '../../../res/OpenSans-Bold.ttf'), {
    family: 'Open Sans',
    weight: 'bold',
  })

  const albumsPerSide = Math.ceil(Math.sqrt(releaseRatings.length))
  const size = albumsPerSide * ALBUM_SIZE
  const canvas = Canvas.createCanvas(size, size)

  await Promise.all(
    [...releaseRatings.entries()].map(([index, releaseRating]) => {
      const row = Math.floor(index / albumsPerSide)
      const col = index % albumsPerSide
      return renderReleaseRating(releaseRating, canvas, row, col)
    })
  )

  return canvas
}

const renderReleaseRating = async (
  { release, rating }: ReleaseRating,
  canvas: Canvas.Canvas,
  row: number,
  col: number
): Promise<void> => {
  const x = col * ALBUM_SIZE
  const y = row * ALBUM_SIZE
  const { isDark } = await renderCover(release, canvas, x, y)
  renderTitleCard({ release, rating }, canvas, x, y, isDark)
}

const renderCover = async (
  release: PartialRelease,
  canvas: Canvas.Canvas,
  x: number,
  y: number
): Promise<{ isDark: boolean }> => {
  const context = canvas.getContext('2d')

  const coverBuffer = await getSlowCover(release)
  if (coverBuffer === undefined) {
    // TODO: add not-found image
    context.fillStyle = '#606060'
    context.fillRect(x, y, ALBUM_SIZE, ALBUM_SIZE)
    return { isDark: true }
  }

  const canvasImage = await Canvas.loadImage(coverBuffer)
  context.drawImage(canvasImage, x, y, ALBUM_SIZE, ALBUM_SIZE)

  const averageColor = await getAverageColor(coverBuffer)
  return { isDark: averageColor.isDark }
}

const renderTitleCard = (
  releaseRating: ReleaseRating,
  canvas: Canvas.Canvas,
  x: number,
  y: number,
  dark: boolean
) => {
  const context = canvas.getContext('2d')

  const { textColor, backgroundColor } = dark
    ? { textColor: '#ffffff', backgroundColor: '#00000080' }
    : { textColor: '#000000', backgroundColor: '#ffffff80' }

  const artist = stringifyArtists(
    releaseRating.release.artists,
    releaseRating.release.artistDisplayName,
    {
      links: false,
    }
  )
  const artistText = getFontForText(canvas, artist, { style: 'bold' })

  const title = releaseRating.release.title
  const titleText = getFontForText(canvas, title)

  const rating = pipe(releaseRating.rating.rating, ifNotNull(stringifyRating))
  const ratingText = pipe(
    rating,
    ifNotNull((rating_) => getFontForText(canvas, rating_))
  )

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
  canvas: Canvas.Canvas,
  text: string,
  {
    maxWidth = TITLE_CARD_MAX_INNER_WIDTH,
    baseFontSize = 20,
    minimumFontSize = 10,
    sizeStep = 1,
    style = '',
    fontTemplate = (size: number) =>
      (style ? `${style} ` : '') +
      `${size}px "Open Sans", "Segoe UI", Tahoma, sans-serif`,
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
