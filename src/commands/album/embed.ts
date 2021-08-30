import { MessageEmbed } from 'discord.js'
import { pipe } from 'fp-ts/function'
import { PartialDate } from '../../database/schemas/partial-date'
import { Rating } from '../../database/schemas/rating'
import { Release } from '../../database/schemas/release'
import { ifDefined } from '../../utils/functional'
import {
  makeUserLink,
  stringifyArtists,
  stringifyRating,
} from '../../utils/render'
import { isDefined } from '../../utils/types'

export const getAlbumEmbed = (
  release: Release,
  rating: Rating | undefined
): MessageEmbed => {
  const embed = new MessageEmbed()
    .setTitle(release.title)
    .setURL(release.combinedUrl)
    .setDescription(
      `by ${stringifyArtists(release.artists, release.artistDisplayName)}`
    )

  if (release.cover !== null) {
    embed.setThumbnail(release.cover)
  }

  if (
    release.type !== null ||
    release.releaseDate !== null ||
    release.rymRating !== null ||
    release.numberRymRatings !== null ||
    release.yearRank !== null ||
    release.overallRank !== null
  ) {
    const lines: [string, string][] = []

    if (release.type !== null) {
      lines.push(['Type', release.type])
    }
    if (release.releaseDate !== null) {
      lines.push(['Released', stringifyDate(release.releaseDate)])
    }
    if (release.rymRating !== null || release.numberRymRatings !== null) {
      let output = ''
      if (release.rymRating !== null) {
        output += `**${release.rymRating.toFixed(2)}**`
      }
      if (release.numberRymRatings !== null) {
        if (output.length > 0) output += ' from '
        output += `${release.numberRymRatings.toLocaleString('en-US')} ratings`
      }
      lines.push(['RYM Rating', output])
    }
    if (
      (release.yearRank !== null && release.releaseDate !== null) ||
      release.overallRank !== null
    ) {
      const parts = []
      if (release.yearRank !== null && release.releaseDate !== null) {
        let output = `#${release.yearRank} for `
        output +=
          release.yearRankUrl !== null
            ? `[${release.releaseDate.year}](${release.yearRankUrl})`
            : release.releaseDate.year
        parts.push(output)
      }
      if (release.overallRank !== null) {
        let output = `#${release.overallRank} `
        output +=
          release.overallRankUrl !== null
            ? `[overall](${release.overallRankUrl})`
            : 'overall'
        parts.push(output)
      }
      lines.push(['Ranked', parts.join(', ')])
    }
    if (rating !== undefined && rating.rating !== null) {
      lines.push([
        `${makeUserLink(rating.username)}'s Rating`,
        stringifyRating(rating.rating),
      ])
    }

    embed.addField(
      '\u200B',
      lines.map((line) => `**${line[0]}**`).join('\n'),
      true
    )
    embed.addField('\u200B', lines.map((line) => line[1]).join('\n'), true)
  }

  if (release.primaryGenres !== null || release.secondaryGenres !== null) {
    let genresString = ''
    if (release.primaryGenres !== null) {
      genresString += release.primaryGenres
        .map((genre) => `**[${genre.name}](${genre.url})**`)
        .join(', ')
    }
    if (release.secondaryGenres !== null) {
      if (genresString.length > 1) genresString += '\n'
      genresString += release.secondaryGenres
        .map((genre) => `[${genre.name}](${genre.url})`)
        .join(', ')
    }
    embed.addField('Genres', genresString)
  }

  if (release.descriptors !== null) {
    embed.addField('Descriptors', `_${release.descriptors.join(', ')}_`)
  }

  if (release.tracks !== null) {
    let tracklistString = release.tracks
      .map((track) => {
        let string_ = `${track.number}. ${track.title}`
        if (track.duration !== null) {
          string_ += ` - \`${track.duration}\``
        }
        return string_
      })
      .join('\n')

    if (tracklistString.length > 1024) {
      let numberLeftOut = 1
      while (numberLeftOut < release.tracks.length) {
        let sliced = tracklistString
        for (let index = 0; index < numberLeftOut; index++) {
          const lastNewline = sliced.lastIndexOf('\n')
          sliced = tracklistString.slice(0, lastNewline)
        }

        const leftOutString = `\n(${numberLeftOut} more)`
        const editedString = sliced + leftOutString

        if (editedString.length <= 1024) {
          tracklistString = editedString
          break
        } else {
          numberLeftOut += 1
        }
      }
    }

    embed.addField('Tracks', tracklistString)
  }

  return embed
}

const stringifyDate = (date: PartialDate): string =>
  [
    date.day,
    date.month,
    pipe(
      date.year,
      ifDefined(
        (year) =>
          `[${year}](https://rateyourmusic.com/charts/top/album/${year})`
      )
    ),
  ]
    .filter(isDefined)
    .join(' ')
