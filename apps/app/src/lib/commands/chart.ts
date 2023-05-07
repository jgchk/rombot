import { ApplicationCommandOptionType, InteractionResponseType, MessageFlags } from 'discord'
import { getLatestRatings } from 'rym'
import type { Artist } from 'rym'
import { ifDefined, ifNotNull } from 'utils'

import { fetchChart } from '$lib/charts'
import type { Chart } from '$lib/charts'

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
  async (command, { fetch, db }) => {
    try {
      const {
        data: { options = [] },
      } = command

      const rows = getOption('rows', ApplicationCommandOptionType.Integer)(options)?.value
      const cols = getOption('columns', ApplicationCommandOptionType.Integer)(options)?.value
      if (rows !== undefined && cols !== undefined && rows * cols > 25) {
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

      const ratings = await getLatestRatings(fetch)(username)

      const chartInput: Chart = {
        entries: ratings.map(({ rating, release }) => ({
          title: release.title,
          artist: stringifyArtists(release.artists, release.artistDisplayName),
          rating: ifNotNull(rating.rating, (r) => r * 2) ?? undefined,
          imageUrl: release.coverThumbnail ?? undefined,
        })),
        coverSize,
        rows,
        cols,
      }

      console.log('Creating chart...')

      const chartBlob = await fetchChart(fetch)(chartInput)

      console.log('Chart created!')
      console.log('Uploading chart...')

      const url = await uploadImage(chartBlob)

      console.log('Chart uploaded!')

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: url },
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

const uploadImage = async (data: Blob) => {
  const url = 'https://litterbox.catbox.moe/resources/internals/api.php'
  const formData = new FormData()

  formData.append('reqtype', 'fileupload')
  formData.append('time', '1h')

  const file = new File([data], 'chart.png')
  formData.append('fileToUpload', file, file.name)

  return fetch(url, {
    method: 'POST',
    body: formData,
  }).then((res) => res.text())
}
