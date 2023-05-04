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
} from 'discord-api-types/v10'

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

export const getErrorEmbed = (error: string): APIEmbed => ({
  color: 3447003,
  author: {
    name: 'Author Name, it can hold 256 characters',
    icon_url: 'https://i.imgur.com/lm8s41J.png',
  },
  thumbnail: {
    url: 'http://i.imgur.com/p2qNFag.png',
  },
  image: {
    url: 'http://i.imgur.com/yVpymuV.png',
  },
  title: 'This is your title, it can hold 256 characters',
  url: 'https://discord.js.org/#/docs/main/master/class/MessageEmbed',
  description: 'This is the main body of text, it can hold 2048 characters.',
  fields: [
    {
      name: 'This is a single field title, it can hold 256 characters',
      value: 'This is a field value, it can hold 1024 characters.',
      inline: false,
    },
    {
      name: 'Error',
      value: error,
      inline: false,
    },
    {
      name: 'Inline fields',
      value: 'They can have different fields with small headlines, and you can inline them.',
      inline: true,
    },
    {
      name: 'Masked links',
      value:
        'You can put [masked links](https://discord.js.org/#/docs/main/master/class/MessageEmbed) inside of rich embeds.',
      inline: true,
    },
    {
      name: 'Markdown',
      value: 'You can put all the *usual* **__Markdown__** inside of them.',
      inline: true,
    },
    {
      name: '\u200b',
      value: '\u200b',
    },
  ],
  timestamp: new Date().toString(),
  footer: {
    icon_url: 'http://i.imgur.com/w1vhFSR.png',
    text: 'This is the footer text, it can hold 2048 characters',
  },
})
