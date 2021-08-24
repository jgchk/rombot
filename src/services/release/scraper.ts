import { CheerioAPI } from 'cheerio'
import { Either, left, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { Genre } from '../../database/schemas/genre'
import { PartialDate } from '../../database/schemas/partial-date'
import { Release } from '../../database/schemas/release'
import { Track } from '../../database/schemas/track'
import { MissingDataError } from '../../errors'
import { ifDefined } from '../../utils/functional'
import { makeRymUrl } from '../../utils/links'
import { getArtists } from '../../utils/scraping'
import { isDefined } from '../../utils/types'

const scrapeRelease = (
  $: CheerioAPI,
  url: string
): Either<MissingDataError, Release> => {
  const combinedUrl = getCombinedUrl($) ?? url
  const issueUrls = getIssueUrls($)

  const id = getId($)
  if (id === null) return left(new MissingDataError('id'))

  const title = getTitle($)
  if (title === null) return left(new MissingDataError('title'))

  const { artists, artistDisplayName } = getArtists($('[itemprop=byArtist]'))
  if (artists.length === 0) return left(new MissingDataError('artist'))

  const type = getType($)
  const releaseDate = getReleaseDate($)
  const cover = getCover($)
  const ratings = getRatings($)
  const rankings = getRankings($)
  const genres = getGenres($)
  const descriptors = getDescriptors($)
  const tracks = getTracks($)

  return right({
    url,
    combinedUrl,
    issueUrls,
    id,
    title,
    artists,
    artistDisplayName,
    type,
    releaseDate,
    cover,
    ...ratings,
    ...rankings,
    ...genres,
    descriptors,
    tracks,
  })
}

export default scrapeRelease

//
//
// HELPER FUNCTIONS
//

const getColumn = ($: CheerioAPI, title: string) =>
  pipe(
    $('.album_info tr')
      .toArray()
      .find((element) => $(element).find('th').text().trim() === title),
    ifDefined((element) => $(element).find('td').first())
  )

export const getCombinedUrl = ($: CheerioAPI): string | undefined =>
  pipe(
    ($('.hide-for-small .release_view a').first().attr('href') || undefined) ??
      ($('meta[property="og:url"]').first().attr('content') || undefined),
    ifDefined(makeRymUrl)
  )

const getIssueUrls = ($: CheerioAPI): string[] => [
  ...new Set(
    $('.hide-for-small .issue_info .issue_title a')
      .toArray()
      .map((element) => $(element).attr('href') || undefined)
      .filter(isDefined)
      .map(makeRymUrl)
  ),
]

const getId = ($: CheerioAPI): string | null =>
  pipe(
    $('.album_title .album_shortcut').first().attr('value') || undefined,
    ifDefined((text) => text.slice(1, -1))
  ) ?? null

const getTitle = ($: CheerioAPI): string | null =>
  $('meta[itemprop=name]').first().attr('content') || null

const getType = ($: CheerioAPI): string | null =>
  pipe(
    getColumn($, 'Type'),
    ifDefined((element) => element.text().trim() || undefined)
  ) ?? null

const getReleaseDate = ($: CheerioAPI): PartialDate | null =>
  pipe(
    getColumn($, 'Released'),
    ifDefined((element) => element.text().trim() || undefined),
    ifDefined((dateString) => {
      const parts = dateString.split(' ')

      const year = pipe(parts.pop(), ifDefined(parseInt))
      if (year === undefined) return

      const month = parts.pop() ?? null
      const day = pipe(parts.pop(), ifDefined(parseInt)) ?? null

      return { year, month, day }
    })
  ) ?? null

const getCover = ($: CheerioAPI): string | null =>
  pipe(
    $('[class^=coverart] img').first().attr('src') || undefined,
    ifDefined(makeRymUrl)
  ) ?? null

const getRatings = ($: CheerioAPI) => {
  const output: Pick<Release, 'rymRating' | 'numberRymRatings'> = {
    rymRating: null,
    numberRymRatings: null,
  }

  const element = getColumn($, 'RYM Rating')
  if (element === undefined) return output

  output.rymRating =
    pipe(
      element.find('.avg_rating').text().trim() || undefined,
      ifDefined(parseFloat)
    ) ?? null
  output.numberRymRatings =
    pipe(
      element.find('.num_ratings b').text().trim().replace(',', '') ||
        undefined,
      ifDefined(parseInt)
    ) ?? null

  return output
}

const getRankings = ($: CheerioAPI) => {
  const output: Pick<
    Release,
    'overallRank' | 'overallRankUrl' | 'yearRank' | 'yearRankUrl'
  > = {
    overallRank: null,
    overallRankUrl: null,
    yearRank: null,
    yearRankUrl: null,
  }

  const element = getColumn($, 'Ranked')
  if (element === undefined) return output

  const text = element.text().trim() || undefined
  if (text === undefined) return output

  const parts = text.split(',')
  for (const part of parts) {
    const match = /#(\d+) (?:for (\d+)|(overall))/.exec(part)
    if (match === null) continue

    const rank = Number.parseInt(match[1])
    const year = match[2]

    if (year !== undefined) {
      output.yearRank = rank
      output.yearRankUrl =
        pipe(
          element
            .find('a')
            .toArray()
            .find((element_) => $(element_).text().trim() === year),
          ifDefined((element_) => $(element_).attr('href') || undefined),
          ifDefined(makeRymUrl)
        ) ?? null
    } else {
      output.overallRank = rank
      output.overallRankUrl =
        pipe(
          element
            .find('a')
            .toArray()
            .find((element) => $(element).text().trim() === 'overall'),
          ifDefined((element) => $(element).attr('href') || undefined),
          ifDefined(makeRymUrl)
        ) ?? null
    }
  }

  return output
}

const getGenres = (
  $: CheerioAPI
): Pick<Release, 'primaryGenres' | 'secondaryGenres'> => {
  const getGenres = (selector: string): Genre[] | null =>
    pipe(
      $(selector)
        .first()
        .find('a.genre')
        .toArray()
        .map((element) => {
          const $element = $(element)
          const name = $element.text().trim() || undefined
          const url = pipe(
            $element.attr('href') || undefined,
            ifDefined(makeRymUrl)
          )
          if (name === undefined || url === undefined) return
          return { name, url }
        })
        .filter(isDefined),
      (genres) => (genres.length > 0 ? genres : null)
    )

  return {
    primaryGenres: getGenres('.release_pri_genres'),
    secondaryGenres: getGenres('.release_sec_genres'),
  }
}

const getDescriptors = ($: CheerioAPI): string[] | null =>
  pipe(
    $('.release_pri_descriptors').first().text().trim() || undefined,
    ifDefined((text) => text.split(',').map((descriptor) => descriptor.trim())),
    ifDefined((array) => (array.length > 0 ? array : undefined))
  ) ?? null

const getTracks = ($: CheerioAPI): Track[] | null => {
  const $tracks = $('.tracks').first()
  if ($tracks.length === 0) return null
  return (
    pipe(
      $tracks
        .find('.track')
        .toArray()
        .map((element) => {
          const $element = $(element)
          const number_ = $element.find('.tracklist_num').text().trim() || null
          const title =
            $element.find('.tracklist_title .rendered_text').text().trim() ||
            null
          const duration =
            $element.find('.tracklist_duration').text().trim() || null
          if (number_ === null || title === null) return
          return { number: number_, title, duration }
        })
        .filter(isDefined),
      (tracks) => (tracks.length > 0 ? tracks : undefined)
    ) ?? null
  )
}
