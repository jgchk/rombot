import cheerio, { Cheerio, Element } from 'cheerio'
import { pipe } from 'fp-ts/function'
import { Artist } from '../database/schemas/artist'
import { Release } from '../database/schemas/release'
import { ifDefined } from './functional'
import { makeRymUrl } from './links'
import { isDefined } from './types'

export const getArtists = (
  parentElement: Cheerio<Element>
): Pick<Release, 'artists' | 'artistDisplayName'> => {
  const mapArtistLink = (element: Element): Artist | undefined => {
    const $ = cheerio.load(element)
    const $element = $(element)
    const name = $element.text().trim() || undefined
    const url = pipe($element.attr('href') || undefined, ifDefined(makeRymUrl))
    if (name === undefined || url === undefined) return
    return { name, url } as const
  }

  const creditedName = parentElement.find('.credited_name')
  if (creditedName.length > 0) {
    const artistDisplayName =
      creditedName.find('span[itemprop=name]').text().trim() || null
    const artists = creditedName
      .find('.credited_list .artist')
      .toArray()
      .map(mapArtistLink)
      .filter(isDefined)
    if (artists.length > 0) return { artistDisplayName, artists }
  }

  const artists = parentElement
    .find('.artist')
    .toArray()
    .map(mapArtistLink)
    .filter(isDefined)

  return { artists, artistDisplayName: null }
}
