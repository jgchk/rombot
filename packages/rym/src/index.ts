import type { Cheerio, CheerioAPI, Element } from 'cheerio'
import { load } from 'cheerio'
import { ifDefined, isDefined, pipe } from 'utils'
import type { Fetcher } from 'utils/browser'

import { MissingDataError } from './errors'
import type { Artist, FullDate, Genre, PartialDate, Release, Tag, Track } from './types'

export * from './types'

export const login =
  (fetch: Fetcher) =>
  async ({ username, password }: { username: string; password: string }) => {
    const res = await fetch('https://rateyourmusic.com/httprequest/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user: username,
        password: password,
        remember: 'true',
        maintain_session: 'true',
        action: 'Login',
        rym_ajax_req: '1',
        request_token: '',
      }),
    })
    const text = await res.text()
    const isSuccess = text.toLowerCase().includes('success')
    return isSuccess
      ? { isLoggedIn: true, cookies: res.headers.get('set-cookie') }
      : { isLoggedIn: false }
  }

export const getLatestRatings = (fetch: Fetcher) => (username: string) =>
  getRatingsPage(fetch)(username, { sort: { date: -1 } })

type GetRatingsPageOptions = {
  page?: number
  sort?: Partial<{ [k in RatingsPageSortParameters]: number }>
}
type RatingsPageSortParameters = 'date' | 'rating'
const ratingPageParameterMap: Record<RatingsPageSortParameters, string> = {
  date: 'd',
  rating: 'r',
}
const getRatingsPage =
  (fetch: Fetcher) => async (username: string, options?: GetRatingsPageOptions) => {
    const { page = 1, sort } = options ?? {}

    let queryString = 'r0.5-5.0'
    if (sort !== undefined) {
      const sortKeys = Object.keys(sort) as RatingsPageSortParameters[]
      if (sortKeys.length > 0) {
        queryString += ',ss'
        for (const key of sortKeys) {
          let parameterSymbol = ratingPageParameterMap[key]
          const direction = sort[key]
          if (direction !== undefined && direction < 0) {
            parameterSymbol += 'd'
          }
          queryString += '.' + parameterSymbol
        }
      }
    }

    const url = `https://rateyourmusic.com/collection/${encodeURIComponent(
      username
    )}/${queryString}/${page}`

    return getRatingsFromUrl(fetch)(url, username)
  }

const getRatingsFromUrl = (fetch: Fetcher) => async (url: string, username: string) => {
  const response = await fetch(url).then((res) => res.text())
  const $ = load(response)

  const elements = $('[id^=page_catalog_item]')
    .toArray()
    .filter((element) => $(element).find('.or_q_albumartist_td').length > 0)

  const ratings = elements.map((el) => parseRating($(el), username))

  return ratings
}

const parseRating = (element: Cheerio<Element>, username: string) => {
  const { artists, artistDisplayName } = getArtists(element)
  if (artists.length === 0) throw new MissingDataError('artist')

  const $title = element.find('.or_q_albumartist_td a.album')
  const title = $title.text().trim() || undefined
  if (title === undefined) throw new MissingDataError('title')

  const issueUrl = ifDefined($title.attr('href') || undefined, makeRymUrl)
  if (issueUrl === undefined) throw new MissingDataError('url')

  const date = getDate(element.find('.or_q_rating_date_d'))
  if (date === undefined) throw new MissingDataError('date')

  const rating =
    ifDefined(element.find('.or_q_rating_date_s img').attr('title') || undefined, parseFloat) ??
    null

  const releaseYear =
    ifDefined(
      element
        .find('.or_q_albumartist .smallgray')
        .toArray()
        .map((element_) => {
          const $ = load(element_)
          return $(element_).text().trim() || undefined
        })
        .filter(isDefined)
        .find((text) => /\(\d+\)/.test(text)),
      (text) => Number.parseInt(text.slice(1, -1))
    ) ?? null

  const ownership = element.find('.or_q_ownership').first().text().trim() || null

  const tags: Tag[] | null = pipe(
    element
      .find('.or_q_tagcloud a')
      .toArray()
      .map((element_) => {
        const $ = load(element_)
        const $element = $(element_)
        const text = $element.text().trim() || undefined
        const url = ifDefined($element.attr('href') || undefined, makeRymUrl)
        if (text === undefined || url === undefined) return
        return { text, url }
      })
      .filter(isDefined),
    (tags) => (tags.length > 0 ? tags : null)
  )

  const coverThumbnail =
    ifDefined(element.find('.or_q_thumb_album img').attr('src') || undefined, makeRymUrl) ?? null

  return {
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
  }
}

const getArtists = (
  parentElement: Cheerio<Element>
): Pick<Release, 'artists' | 'artistDisplayName'> => {
  const mapArtistLink = (element: Element): Artist | undefined => {
    const $ = load(element)
    const $element = $(element)
    const name = $element.text().trim() || undefined
    const url = ifDefined($element.attr('href') || undefined, makeRymUrl)
    if (name === undefined || url === undefined) return
    return { name, url } as const
  }

  const creditedName = parentElement.find('.credited_name')
  if (creditedName.length > 0) {
    const artistDisplayName = creditedName.find('span[itemprop=name]').text().trim() || null
    const artists = creditedName
      .find('.credited_list .artist')
      .toArray()
      .map(mapArtistLink)
      .filter(isDefined)
    if (artists.length > 0) return { artistDisplayName, artists }
  }

  const artists = parentElement.find('.artist').toArray().map(mapArtistLink).filter(isDefined)

  return { artists, artistDisplayName: null }
}

const makeRymUrl = (url: string): string => {
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://rateyourmusic.com${url}`
  return url
}

const getDate = (element: Cheerio<Element>): FullDate | undefined => {
  const month = element.find('.date_element_month').text().trim() || undefined
  if (month === undefined) return

  const day = ifDefined(element.find('.date_element_day').text().trim() || undefined, parseInt)
  if (day === undefined) return

  const year = ifDefined(element.find('.date_element_year').text().trim() || undefined, parseInt)
  if (year === undefined) return

  return { day, month, year }
}

export const getReleaseFromUrl = (fetch: Fetcher) => async (url: string) => {
  const $ = await loadPage(fetch)(url)
  const release = scrapeRelease($, url)
  return release
}

const loadPage =
  (fetch: Fetcher) =>
  async (url: string): Promise<CheerioAPI> => {
    const response = await fetch(url).then((res) => res.text())
    return load(response)
  }

const scrapeRelease = ($: CheerioAPI, url: string) => {
  const combinedUrl = getCombinedUrl($) ?? url
  const issueUrls = getIssueUrls($)

  const id = getId($)
  if (id === null) throw new MissingDataError('id')

  const title = getTitle($)
  if (title === null) throw new MissingDataError('title')

  const { artists, artistDisplayName } = getArtists($('[itemprop=byArtist]'))
  if (artists.length === 0) throw new MissingDataError('artist')

  const type = getType($)
  const releaseDate = getReleaseDate($)
  const cover = getCover($)
  const ratings = getRatings($)
  const rankings = getRankings($)
  const genres = getGenres($)
  const descriptors = getDescriptors($)
  const tracks = getTracks($)

  return {
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
  }
}

const getCombinedUrl = ($: CheerioAPI): string | undefined =>
  ifDefined(
    ($('.hide-for-small .release_view a').first().attr('href') || undefined) ??
      ($('meta[property="og:url"]').first().attr('content') || undefined),
    makeRymUrl
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
  ifDefined($('.album_title .album_shortcut').first().attr('value') || undefined, (text) =>
    text.slice(1, -1)
  ) ?? null

const getTitle = ($: CheerioAPI): string | null =>
  $('meta[itemprop=name]').first().attr('content') || null

const getType = ($: CheerioAPI): string | null =>
  ifDefined(getColumn($, 'Type'), (element) => element.text().trim() || undefined) ?? null

const getReleaseDate = ($: CheerioAPI): PartialDate | null =>
  pipe(
    getColumn($, 'Released'),
    (el) => ifDefined(el, (element) => element.text().trim() || undefined),
    (el) =>
      ifDefined(el, (dateString) => {
        const parts = dateString.split(' ')

        const year = ifDefined(parts.pop(), parseInt)
        if (year === undefined) return

        const month = parts.pop() ?? null
        const day = ifDefined(parts.pop(), parseInt) ?? null

        return { year, month, day }
      })
  ) ?? null

const getCover = ($: CheerioAPI): string | null =>
  ifDefined($('[class^=coverart] img').first().attr('src') || undefined, makeRymUrl) ?? null

const getRatings = ($: CheerioAPI) => {
  const output: Pick<Release, 'rymRating' | 'numberRymRatings'> = {
    rymRating: null,
    numberRymRatings: null,
  }

  const element = getColumn($, 'RYM Rating')
  if (element === undefined) return output

  output.rymRating =
    ifDefined(element.find('.avg_rating').text().trim() || undefined, parseFloat) ?? null
  output.numberRymRatings =
    ifDefined(
      element.find('.num_ratings b').text().trim().replace(',', '') || undefined,
      parseInt
    ) ?? null

  return output
}

const getRankings = ($: CheerioAPI) => {
  const output: Pick<Release, 'overallRank' | 'overallRankUrl' | 'yearRank' | 'yearRankUrl'> = {
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
          (el) => ifDefined(el, (element_) => $(element_).attr('href') || undefined),
          (el) => ifDefined(el, makeRymUrl)
        ) ?? null
    } else {
      output.overallRank = rank
      output.overallRankUrl =
        pipe(
          element
            .find('a')
            .toArray()
            .find((element) => $(element).text().trim() === 'overall'),
          (el) => ifDefined(el, (element) => $(element).attr('href') || undefined),
          (el) => ifDefined(el, makeRymUrl)
        ) ?? null
    }
  }

  return output
}

const getGenres = ($: CheerioAPI): Pick<Release, 'primaryGenres' | 'secondaryGenres'> => {
  const getGenres = (selector: string): Genre[] | null =>
    pipe(
      $(selector)
        .first()
        .find('a.genre')
        .toArray()
        .map((element) => {
          const $element = $(element)
          const name = $element.text().trim() || undefined
          const url = ifDefined($element.attr('href') || undefined, makeRymUrl)
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
    (el) => ifDefined(el, (text) => text.split(',').map((descriptor) => descriptor.trim())),
    (el) => ifDefined(el, (array) => (array.length > 0 ? array : undefined))
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
          const title = $element.find('.tracklist_title .rendered_text').text().trim() || null
          const duration = $element.find('.tracklist_duration').text().trim() || null
          if (number_ === null || title === null) return
          return { number: number_, title, duration }
        })
        .filter(isDefined),
      (tracks) => (tracks.length > 0 ? tracks : undefined)
    ) ?? null
  )
}

const getColumn = ($: CheerioAPI, title: string) =>
  ifDefined(
    $('.album_info tr')
      .toArray()
      .find((element) => $(element).find('th').text().trim() === title),
    (element) => $(element).find('td').first()
  )
