import {
  MessageActionRow,
  MessageButton,
  ReplyMessageOptions,
} from 'discord.js'
import { isLeft } from 'fp-ts/Either'
import { getRatingsForAllIssues } from '../../services/rating'
import { Command } from '../../types'
import { subscribeButton, unsubscribeButton } from '../../utils/buttons'
import getWhoKnowsAlbumEmbed from './embed'
import { isRated } from './types'
import { getRelease } from './utils'

const BUTTON_TIMEOUT = 60 * 1000

const whoknowsalbum: Command = {
  name: 'whoknowsalbum',
  aliases: ['whoknows', 'wkab', 'wka', 'wa', 'wk', 'w'],
  description:
    "shows who in your server rated your last-rated album or the album you're searching for",
  usage: 'whoknowsalbum [QUERY|USER]',
  examples: [
    'wa',
    'whoknowsalbum',
    'whoknowsalbum The Beatles Abbey Road',
    'whoknowsalbum @user',
    'whoknowsalbum ~sharifi',
  ],
  execute: async (message) => {
    const maybeRelease = await getRelease(message)
    if (isLeft(maybeRelease)) return maybeRelease
    const release = maybeRelease.right

    const maybeRatings = await getRatingsForAllIssues(release)
    if (isLeft(maybeRatings)) return maybeRatings
    const ratings = maybeRatings.right.filter(isRated)

    const previousButton = subscribeButton(
      new MessageButton().setEmoji('👈').setStyle('PRIMARY'),
      async (interaction) => {
        page -= 1
        timeout.refresh()
        await interaction.update(render())
      }
    )
    const nextButton = subscribeButton(
      new MessageButton().setEmoji('👉').setStyle('PRIMARY'),
      async (interaction) => {
        page += 1
        timeout.refresh()
        await interaction.update(render())
      }
    )

    let page = 0
    let showButtons = true
    const render = () => {
      const { embed, totalPages } = getWhoKnowsAlbumEmbed(
        release,
        ratings,
        message.message.author,
        page
      )
      const output: ReplyMessageOptions = { embeds: [embed] }
      if (showButtons && totalPages > 1) {
        previousButton.setDisabled(page === 0)
        nextButton.setDisabled(page === totalPages - 1)
        output.components = [
          new MessageActionRow().addComponents(previousButton, nextButton),
        ]
      } else {
        output.components = []
      }
      return output
    }

    const reply = await message.message.reply(render())
    const timeout = setTimeout(() => {
      unsubscribeButton(previousButton)
      unsubscribeButton(nextButton)
      showButtons = false
      void reply.edit(render())
    }, BUTTON_TIMEOUT)
  },
}

export default whoknowsalbum
