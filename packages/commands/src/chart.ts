import { ApplicationCommandOptionType } from 'discord'
import { getLatestRatings, getReleaseFromUrl } from 'rym'
import type { Artist } from 'rym'
import { ifDefined, ifNotNull } from 'utils'
import type { Fetcher } from 'utils/browser'
import { z } from 'zod'

import { cmd } from './types'
import { getErrorEmbed, getInfoEmbed, getOption, getWarningEmbed } from './utils'

export const chart = cmd(
  {
    name: 'chart',
    description: 'Generate a chart of your ratings',
    options: [
      {
        name: 'username',
        description: 'The RYM username to generate a chart for (defaults to self)',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'cover-size',
        description: 'The size of each cover in the chart in px (defaults to 300)',
        type: ApplicationCommandOptionType.Integer,
        min_value: 100,
        max_value: 300,
      },
      {
        name: 'rows',
        description: 'The number of rows in the chart',
        type: ApplicationCommandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
      {
        name: 'columns',
        description: 'The number of columns in the chart',
        type: ApplicationCommandOptionType.Integer,
        min_value: 1,
        max_value: 25,
      },
    ],
  },
  async (command, { fetch, db, redis }) => {
    try {
      const {
        data: { options = [] },
      } = command

      const rows = getOption('rows', ApplicationCommandOptionType.Integer)(options)?.value
      const cols = getOption('columns', ApplicationCommandOptionType.Integer)(options)?.value
      const numEntries = rows !== undefined && cols !== undefined ? rows * cols : undefined
      if (numEntries !== undefined && numEntries > 25) {
        return {
          embeds: [
            getWarningEmbed({
              title: 'Chart too big',
              warning:
                'RYM prevents us from putting more than 25 albums in a chart. Blame sharifi.',
            }),
          ],
          private: true,
        }
      }

      const coverSize = getOption(
        'cover-size',
        ApplicationCommandOptionType.Integer
      )(options)?.value

      const discordUser = command.user ?? command.member?.user
      if (!discordUser) {
        return {
          embeds: [
            getErrorEmbed({
              error: 'Could not extract user from command. This is a bug, please report it.',
            }),
          ],
          private: true,
        }
      }

      let username = getOption('username', ApplicationCommandOptionType.String)(options)?.value
      if (!username) {
        const account = await db.accounts.find(discordUser.id)
        if (account === undefined) {
          return {
            embeds: [
              getInfoEmbed({
                title: 'Need username',
                description: 'Set your RYM username with `/set username` then retry',
              }),
            ],
            private: true,
          }
        }
        username = account.rymUsername
      }

      console.log('Fetching ratings...')

      let ratings: Awaited<ReturnType<ReturnType<typeof getLatestRatings>>>
      try {
        ratings = await getLatestRatings(fetch)(username)
        if (ratings.length === 0) {
          console.error(`No ratings found for ${username}`)
          return {
            embeds: [
              getErrorEmbed({
                error: `No ratings found for [**${username}**](https://rateyourmusic.com/collection/${username}). If you changed your username, you'll need to update it with \`/set username\``,
              }),
            ],
            private: true,
          }
        }
      } catch (e) {
        console.error(`Error getting ratings for ${username}`, e)
        return {
          embeds: [
            getErrorEmbed({
              error: `Error getting ratings for [**${username}**](https://rateyourmusic.com/collection/${username}). Is it typed correctly?`,
            }),
          ],
          private: true,
        }
      }

      if (numEntries !== undefined) {
        ratings = ratings.slice(0, numEntries)
      }

      let numCached = 0
      const chartInput: Chart = {
        entries: await Promise.all(
          ratings.map(async ({ rating, release }) => {
            let fullRelease = await redis.getRelease(release.issueUrl)
            if (fullRelease === null) {
              fullRelease = await getReleaseFromUrl(fetch)(release.issueUrl)
              await redis.setRelease(release.issueUrl, fullRelease)
            } else {
              numCached += 1
            }

            return {
              title: release.title,
              artist: stringifyArtists(release.artists, release.artistDisplayName),
              rating: ifNotNull(rating.rating, (r) => r * 2) ?? undefined,
              imageUrl: fullRelease.cover ?? release.coverThumbnail ?? undefined,
            }
          })
        ),
        coverSize,
        rows,
        cols,
      }

      console.log(`Fetched ratings! (cached: ${numCached}/${chartInput.entries.length})`)
      console.log('Creating chart...')

      const chartBlob = await fetchChart(fetch)(chartInput)
      const chartFile = new File([chartBlob], 'chart.jpg', { type: 'image/jpeg' })

      console.log('Chart created!')

      return {
        files: [chartFile],
      }
    } catch (e) {
      console.error('Error creating chart', e)
      return {
        embeds: [
          getErrorEmbed({ error: 'Error creating chart. This is a bug, please report it.' }),
        ],
        private: true,
      }
    }
  }
)

const stringifyArtists = (artists: Artist[], displayName: string | null): string => {
  if (displayName !== null) return displayName
  if (artists.length === 1) return artists[0].name

  const finalArtist = ifDefined(artists.pop(), (a) => a.name)
  if (finalArtist === undefined) throw new Error('Collab has no artists')

  return `${artists.map((a) => a.name).join(', ')} & ${finalArtist}`
}

export type ChartEntry = z.infer<typeof ChartEntry>
export const ChartEntry = z.object({
  imageUrl: z.string().optional(),
  title: z.string(),
  artist: z.string(),
  rating: z.number().min(1).max(10).optional(),
})

export type Chart = z.infer<typeof Chart>
export const Chart = z.object({
  entries: ChartEntry.array().min(1).max(25),
  rows: z.number().min(1).max(25).optional(),
  cols: z.number().min(1).max(25).optional(),
  coverSize: z.number().min(100).max(800).optional(),
})

export const fetchChart = (fetch: Fetcher) => (chart: Chart) =>
  fetch('https://charts-jgchk.vercel.app/api/chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chart),
  }).then((res) => res.blob())
