import { error } from '@sveltejs/kit'
import { getDatabase } from 'db'
import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'
import { getLatestRatings } from 'rym'
import type { Artist } from 'rym'
import { ifDefined, ifNotNull } from 'utils'

import { fetchChart } from '$lib/charts'
import type { Chart } from '$lib/charts'
import { env } from '$lib/env'

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
    ],
  },
  async (command, { fetch }) => {
    try {
      const {
        data: { options = [] },
      } = command

      const discordUser = command.user ?? command.member?.user
      if (!discordUser) {
        throw error(400, 'Could not extract user from command')
      }

      let username = getOption('username', ApplicationCommandOptionType.String)(options)?.value
      if (!username) {
        const account = await getDatabase({ connectionString: env.DATABASE_URL }).accounts.find(
          discordUser.id
        )
        if (account === undefined) {
          throw error(401, 'Set your RYM username with `/set username` then retry')
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
