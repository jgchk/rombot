import { MessageActionRow, MessageButton } from 'discord.js'
import { isLeft } from 'fp-ts/Either'
import { getRatingsForAllIssues } from '../../services/rating'
import { Command } from '../../types'
import { subscribeButton, unsubscribeButtons } from '../../utils/buttons'
import getWhoKnowsAlbumEmbed from './embed'
import { Sort, isRated } from './types'
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

    const ratingButton = subscribeButton(
      new MessageButton().setLabel('Rating').setStyle('SECONDARY'),
      async (interaction) => {
        sort = 'rating'
        page = 0
        timeout.refresh()
        await interaction.update(render())
      }
    )
    const usernameButton = subscribeButton(
      new MessageButton().setLabel('Username').setStyle('SECONDARY'),
      async (interaction) => {
        sort = 'username'
        page = 0
        timeout.refresh()
        await interaction.update(render())
      }
    )
    const dateButton = subscribeButton(
      new MessageButton().setLabel('Date').setStyle('SECONDARY'),
      async (interaction) => {
        sort = 'date'
        page = 0
        timeout.refresh()
        await interaction.update(render())
      }
    )

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
    let sort: Sort = 'rating'
    let showButtons = true
    const render = () => {
      const { embed, totalPages } = getWhoKnowsAlbumEmbed(
        release,
        ratings,
        message.message.author,
        page,
        sort
      )
      const buttonRows: MessageActionRow[] = []
      if (showButtons) {
        ratingButton.setDisabled(sort === 'rating')
        usernameButton.setDisabled(sort === 'username')
        dateButton.setDisabled(sort === 'date')
        buttonRows.push(
          new MessageActionRow().addComponents(
            ratingButton,
            usernameButton,
            dateButton
          )
        )
        if (totalPages > 1) {
          previousButton.setDisabled(page === 0)
          nextButton.setDisabled(page === totalPages - 1)
          buttonRows.push(
            new MessageActionRow().addComponents(previousButton, nextButton)
          )
        }
      }
      return { embeds: [embed], components: buttonRows }
    }

    const reply = await message.message.reply(render())
    const timeout = setTimeout(() => {
      unsubscribeButtons(previousButton, nextButton)
      showButtons = false
      void reply.edit(render())
    }, BUTTON_TIMEOUT)
  },
}

export default whoknowsalbum
