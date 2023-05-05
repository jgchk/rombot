import { error } from '@sveltejs/kit'
import { getDatabase } from 'db'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10'
import { getLatestRatings, getReleaseFromUrl } from 'rym'
import { createChart } from 'rym/charts'
import { fetcher } from 'utils/browser'

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

  const chartReleases = await Promise.all(
    ratings.slice(0, 9).map(async ({ rating, release }) => {
      const fullRelease = await getReleaseFromUrl(fetch)(release.issueUrl)
      return {
        rating,
        release: fullRelease,
      }
    })
  )

  console.log('Creating chart...')

  const chartSize = 3
  const chartBuffer = await createChart(fetch)(chartReleases.slice(0, chartSize * chartSize))

  console.log('Chart created!')

  const file = new File([chartBuffer], 'chart.png', { type: 'image/png' })

  return new Response(file)
}

export const config = {
  runtime: 'nodejs16.x',
}
