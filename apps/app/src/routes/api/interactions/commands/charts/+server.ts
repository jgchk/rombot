import { error } from '@sveltejs/kit'
import { getDatabase } from 'db'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10'
import { getLatestRatings } from 'rym'
import type { Artist } from 'rym'
import { ifDefined, ifNotNull } from 'utils'
import { fetcher } from 'utils/browser'

import { fetchChart } from '$lib/charts'
import type { Chart } from '$lib/charts'
import { getOption } from '$lib/commands/utils'
import { verify } from '$lib/discord'
import { env } from '$lib/env'

import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, fetch: fetch_ }) => {
  const rawBody = await request.arrayBuffer()
  const isVerified = verify(request, rawBody)
  if (!isVerified) throw error(401, 'Bad request signature')

  const command = JSON.parse(
    new TextDecoder().decode(rawBody)
  ) as APIChatInputApplicationCommandInteraction

  const fetch = fetcher(fetch_)

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

  return new Response(chartBlob)
}

const stringifyArtists = (artists: Artist[], displayName: string | null): string => {
  if (displayName !== null) return displayName
  if (artists.length === 1) return artists[0].name

  const finalArtist = ifDefined(artists.pop(), (a) => a.name)
  if (finalArtist === undefined) throw new Error('Collab has no artists')

  return `${artists.map((a) => a.name).join(', ')} & ${finalArtist}`
}

export const config = {
  runtime: 'nodejs18.x',
}
