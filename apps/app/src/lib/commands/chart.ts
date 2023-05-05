import { ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'

import { cmd } from './types'
import { getErrorEmbed } from './utils'

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
  async (command, { fetch, request }) => {
    try {
      const chart = await fetch('/api/interactions/commands/charts', {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(command),
      }).then((res) => res.arrayBuffer())

      const url = await uploadImage(chart)

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

const uploadImage = async (data: ArrayBuffer) => {
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
