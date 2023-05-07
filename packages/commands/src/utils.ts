import type {
  APIApplicationCommandInteractionDataAttachmentOption,
  APIApplicationCommandInteractionDataBooleanOption,
  APIApplicationCommandInteractionDataChannelOption,
  APIApplicationCommandInteractionDataIntegerOption,
  APIApplicationCommandInteractionDataMentionableOption,
  APIApplicationCommandInteractionDataNumberOption,
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandInteractionDataRoleOption,
  APIApplicationCommandInteractionDataStringOption,
  APIApplicationCommandInteractionDataSubcommandGroupOption,
  APIApplicationCommandInteractionDataSubcommandOption,
  APIApplicationCommandInteractionDataUserOption,
  APIEmbed,
  ApplicationCommandOptionType,
} from 'discord'
import { toErrorString } from 'utils'

export type OptionType<T extends ApplicationCommandOptionType> =
  T extends ApplicationCommandOptionType.Subcommand
    ? APIApplicationCommandInteractionDataSubcommandOption
    : T extends ApplicationCommandOptionType.SubcommandGroup
    ? APIApplicationCommandInteractionDataSubcommandGroupOption
    : T extends ApplicationCommandOptionType.String
    ? APIApplicationCommandInteractionDataStringOption
    : T extends ApplicationCommandOptionType.Integer
    ? APIApplicationCommandInteractionDataIntegerOption
    : T extends ApplicationCommandOptionType.Boolean
    ? APIApplicationCommandInteractionDataBooleanOption
    : T extends ApplicationCommandOptionType.User
    ? APIApplicationCommandInteractionDataUserOption
    : T extends ApplicationCommandOptionType.Channel
    ? APIApplicationCommandInteractionDataChannelOption
    : T extends ApplicationCommandOptionType.Role
    ? APIApplicationCommandInteractionDataRoleOption
    : T extends ApplicationCommandOptionType.Mentionable
    ? APIApplicationCommandInteractionDataMentionableOption
    : T extends ApplicationCommandOptionType.Number
    ? APIApplicationCommandInteractionDataNumberOption
    : T extends ApplicationCommandOptionType.Attachment
    ? APIApplicationCommandInteractionDataAttachmentOption
    : never

export const getOption =
  <T extends ApplicationCommandOptionType>(name: string, type: T) =>
  (options: APIApplicationCommandInteractionDataOption[]) =>
    options.find(isOption(name, type))

export const isOption =
  <T extends ApplicationCommandOptionType>(name: string, type: T) =>
  (option: APIApplicationCommandInteractionDataOption): option is OptionType<T> =>
    option.name === name && option.type === type

export const getErrorEmbed = (error: unknown): APIEmbed => ({
  title: 'Error',
  description: `\`${toErrorString(error)}\``,
  color: 0xff0000,
  timestamp: new Date().toISOString(),
  author: {
    name: 'Error',
    icon_url:
      'https://cdn.discordapp.com/attachments/640977957288017933/1104862233562988741/emoji.png',
  },
})
