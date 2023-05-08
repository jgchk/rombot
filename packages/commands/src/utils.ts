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
  author: {
    name: 'Error',
    icon_url:
      'https://cdn.discordapp.com/attachments/640977957288017933/1104862233562988741/emoji.png',
  },
  description: toErrorString(error),
  color: 0xf92313,
})

export const getWarningEmbed = (warning: unknown): APIEmbed => ({
  author: {
    name: 'Warning',
    icon_url:
      'https://cdn.discordapp.com/attachments/640977957288017933/1105150000046030939/emoji.png',
  },
  description: toErrorString(warning),
  color: 0xfccf19,
})

export const getInfoEmbed = ({
  title,
  description,
}: {
  title?: string
  description: string
}): APIEmbed => ({
  author: {
    name: title ?? 'Info',
    icon_url:
      'https://cdn.discordapp.com/attachments/640977957288017933/1105151748248719461/emoji.png',
  },
  description,
  color: 0x1d49f7,
})

export const getSuccessEmbed = ({
  title,
  description,
}: {
  title?: string
  description: string
}): APIEmbed => ({
  author: {
    name: title ?? 'Success',
    icon_url:
      'https://cdn.discordapp.com/attachments/640977957288017933/1105154077484122122/emoji.png',
  },
  description,
  color: 0x22d83a,
})
