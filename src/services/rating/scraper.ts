import cheerio, { Cheerio, Element } from 'cheerio'
import { Either, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { FullDate } from '../../database/schemas/full-date'
import { PartialRelease } from '../../database/schemas/partial-release'
import { Rating } from '../../database/schemas/rating'
import { Tag } from '../../database/schemas/tag'
import { MissingDataError } from '../../errors'
import { ifDefined } from '../../utils/functional'
import { makeRymUrl } from '../../utils/links'
import { getArtists } from '../../utils/scraping'
import { isDefined } from '../../utils/types'

export const parseRating = (
  element: Cheerio<Element>,
  username: string
): Either<MissingDataError, { rating: Rating; release: PartialRelease }> => {
  const { artists, artistDisplayName } = getArtists(element)
  if (artists.length === 0) return left(new MissingDataError('artist'))

  const $title = element.find('.or_q_albumartist_td a.album')
  const title = $title.text().trim() || undefined
  if (title === undefined) return left(new MissingDataError('title'))

  const issueUrl = pipe($title.attr('href') || undefined, ifDefined(makeRymUrl))
  if (issueUrl === undefined) return left(new MissingDataError('url'))

  const date = getDate(element.find('.or_q_rating_date_d'))
  if (date === undefined) return left(new MissingDataError('date'))

  const rating =
    pipe(
      element.find('.or_q_rating_date_s img').attr('title') || undefined,
      ifDefined(parseFloat)
    ) ?? null

  const releaseYear =
    pipe(
      element
        .find('.or_q_albumartist .smallgray')
        .toArray()
        .map((element_) => {
          const $ = cheerio.load(element_)
          return $(element_).text().trim() || undefined
        })
        .filter(isDefined)
        .find((text) => /\(\d+\)/.test(text)),
      ifDefined((text) => Number.parseInt(text.slice(1, -1)))
    ) ?? null

  const ownership =
    element.find('.or_q_ownership').first().text().trim() || null

  const tags: Tag[] | null = pipe(
    element
      .find('.or_q_tagcloud a')
      .toArray()
      .map((element_) => {
        const $ = cheerio.load(element_)
        const $element = $(element_)
        const text = $element.text().trim() || undefined
        const url = pipe(
          $element.attr('href') || undefined,
          ifDefined(makeRymUrl)
        )
        if (text === undefined || url === undefined) return
        return { text, url }
      })
      .filter(isDefined),
    (tags) => (tags.length > 0 ? tags : null)
  )

  const coverThumbnail =
    pipe(
      element.find('.or_q_thumb_album img').attr('src') || undefined,
      ifDefined(makeRymUrl)
    ) ?? null

  return right({
    rating: {
      username,
      issueUrl,
      date,
      rating,
      ownership,
      tags,
    },
    release: {
      issueUrl,
      title,
      artists,
      artistDisplayName,
      releaseYear,
      coverThumbnail,
    },
  })
}

const getDate = (element: Cheerio<Element>): FullDate | undefined => {
  const month = element.find('.date_element_month').text().trim() || undefined
  if (month === undefined) return

  const day = pipe(
    element.find('.date_element_day').text().trim() || undefined,
    ifDefined(parseInt)
  )
  if (day === undefined) return

  const year = pipe(
    element.find('.date_element_year').text().trim() || undefined,
    ifDefined(parseInt)
  )
  if (year === undefined) return

  return { day, month, year }
}
