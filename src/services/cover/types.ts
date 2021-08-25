import { PartialRelease } from '../../database/schemas/partial-release'

export type CoverArgument = Pick<
  PartialRelease,
  'artists' | 'artistDisplayName' | 'title' | 'issueUrl'
>
