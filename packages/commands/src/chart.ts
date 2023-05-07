import { ApplicationCommandOptionType, InteractionResponseType, MessageFlags } from 'discord'
import { getLatestRatings, getReleaseFromUrl } from 'rym'
import type { Artist } from 'rym'
import { ifDefined, ifNotNull } from 'utils'
import type { Fetcher } from 'utils/browser'
import { z } from 'zod'

import { cmd } from './types'
import { getErrorEmbed, getOption } from './utils'

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
        description: 'The size of each cover in the chart in px',
        type: ApplicationCommandOptionType.Integer,
        min_value: 100,
        max_value: 800,
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
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            embeds: [
              getErrorEmbed(
                "Due to RYM rate limiting, you can't have more than 25 albums in a chart. Blame sharifi."
              ),
            ],
            flags: MessageFlags.Ephemeral,
          },
        }
      }

      const coverSize = getOption(
        'cover-size',
        ApplicationCommandOptionType.Integer
      )(options)?.value

      const discordUser = command.user ?? command.member?.user
      if (!discordUser) {
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            embeds: [
              getErrorEmbed(
                'Could not extract user from command. This is a bug, please report it.'
              ),
            ],
          },
        }
      }

      let username = getOption('username', ApplicationCommandOptionType.String)(options)?.value
      if (!username) {
        const account = await db.accounts.find(discordUser.id)
        if (account === undefined) {
          return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              embeds: [getErrorEmbed('Set your RYM username with `/set username` then retry')],
            },
          }
        }
        username = account.rymUsername
      }

      console.log('Fetching ratings...')

      let ratings = await getLatestRatings(fetch)(username)

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
      const chartFile = new File([chartBlob], 'chart.png', { type: 'image/png' })

      console.log('Chart created!')

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            {
              image: {
                url: `attachment://${chartFile.name}`,
              },
            },
          ],
        },
        files: [chartFile],
      }
    } catch (e) {
      console.error('Error creating chart', e)
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [getErrorEmbed('Error creating chart')],
        },
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
