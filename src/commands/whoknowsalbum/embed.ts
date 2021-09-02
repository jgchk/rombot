import { MessageEmbed, User } from 'discord.js'
import { compareFullDates } from '../../database/schemas/full-date'
import { Release } from '../../database/schemas/release'
import { sum } from '../../utils/math'
import {
  makeUserLink,
  stringifyArtists,
  stringifyFullDate,
  stringifyRating,
} from '../../utils/render'
import { Rated, Sort } from './types'

const getWhoKnowsAlbumEmbed = (
  release: Release,
  ratings: Rated[],
  user: User,
  page: number,
  sort: Sort
): { embed: MessageEmbed; totalPages: number } => {
  const embed = new MessageEmbed().setAuthor(
    `Who knows ${release.title} in RateOurMusic`,
    user.displayAvatarURL(),
    release.url
  )

  if (release.cover !== null) {
    embed.setThumbnail(release.cover)
  }

  const sortedRatings = ratings.sort((a, b) => {
    const ratingComparison = -(a.rating - b.rating)
    const dateComparison = -compareFullDates(a.date, b.date)
    const usernameComparison = a.username.localeCompare(b.username)

    let order: number[]

    if (sort === 'rating') {
      order = [ratingComparison, dateComparison, usernameComparison]
    } else if (sort === 'username') {
      order = [usernameComparison, ratingComparison, dateComparison]
    } else {
      order = [dateComparison, ratingComparison, usernameComparison]
    }

    return order.find((element) => element !== 0) ?? 0
  })

  const pages = getPages(release, sortedRatings)
  embed.setDescription(pages[page])

  if (ratings.length > 0) {
    const averageRating =
      sum(ratings.map((rating) => rating.rating)) / ratings.length
    let footer = `Average Rating: ${averageRating.toFixed(2)}`
    if (pages.length > 1) footer += ` | Page ${page + 1}/${pages.length}`
    embed.setFooter(footer)
  }

  return { embed, totalPages: pages.length }
}

const getPages = (release: Release, ratings: Rated[]): string[] => {
  if (ratings.length === 0) {
    return ['Nobody knows this release']
  }

  const pages = []
  const ratingsLeft = [...ratings]

  while (ratingsLeft.length > 0) {
    let description = `**${stringifyArtists(
      release.artists,
      release.artistDisplayName
    )}** - [${release.title}](${release.url})`
    if (release.releaseDate !== null) {
      description += ` _(${release.releaseDate.year})_`
    }
    description += '\n\n'

    let currentRating: Rated | undefined
    let currentRatingRow: string
    while (
      (currentRating = ratingsLeft.shift()) !== undefined &&
      description.length +
        (currentRatingRow = '\n' + makeRatingRow(currentRating)).length <
        1024
    ) {
      description += currentRatingRow
    }

    pages.push(description)
  }

  return pages
}

const makeRatingRow = (rating: Rated) =>
  `${stringifyRating(rating.rating).padEnd(5, ' ')} - **${makeUserLink(
    rating.username
  )}** - _${stringifyFullDate(rating.date)}_`

export default getWhoKnowsAlbumEmbed
