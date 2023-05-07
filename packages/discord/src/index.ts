import type {
  RESTGetAPIApplicationCommandsResult,
  RESTPatchAPIInteractionOriginalResponseJSONBody,
  RESTPatchAPIInteractionOriginalResponseResult,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIApplicationCommandsResult,
} from 'discord-api-types/v10'
import type { Fetcher } from 'utils/browser'

export * from 'discord-api-types/v10'

export const Discord = (
  fetch: Fetcher,
  env: { PUBLIC_KEY: string; APP_ID: string; BOT_TOKEN: string }
) => {
  const api = {
    editInteractionResponse: (
      interactionToken: string,
      response: RESTPatchAPIInteractionOriginalResponseJSONBody,
      files?: File[]
    ) =>
      files?.length
        ? api.editInteractionResponseWithUploads(interactionToken, response, files)
        : fetch(
            `https://discord.com/api/v10/webhooks/${env.APP_ID}/${interactionToken}/messages/@original`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bot ${env.BOT_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(response),
            }
          ).then((res) => res.json<RESTPatchAPIInteractionOriginalResponseResult>()),

    editInteractionResponseWithUploads: (
      interactionToken: string,
      response: RESTPatchAPIInteractionOriginalResponseJSONBody,
      files: File[]
    ) => {
      const formData = new FormData()
      formData.append('payload_json', JSON.stringify(response))

      for (const [i, file] of files.entries()) {
        formData.append(`files[${i}]`, file)
      }

      return fetch(
        `https://discord.com/api/v10/webhooks/${env.APP_ID}/${interactionToken}/messages/@original`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bot ${env.BOT_TOKEN}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      )
    },

    createGlobalCommand: (data: RESTPostAPIApplicationCommandsJSONBody) =>
      fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then((res) => res.json<RESTPostAPIApplicationCommandsResult>()),

    deleteGlobalCommandByName: async (name: string) => {
      const commands = await api.getGlobalCommands()
      const command = commands.find((command) => command.name === name)
      if (!command) {
        throw new Error(`Failed to delete command, command not found: ${name}`)
      }
      await api.deleteGlobalCommand(command.id)
    },

    getGlobalCommands: () =>
      fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands`, {
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
        },
      }).then((res) => res.json<RESTGetAPIApplicationCommandsResult>()),

    deleteGlobalCommand: (commandId: string) =>
      fetch(`https://discord.com/api/v10/applications/${env.APP_ID}/commands/${commandId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${env.BOT_TOKEN}`,
        },
      }),
  }

  return api
}
