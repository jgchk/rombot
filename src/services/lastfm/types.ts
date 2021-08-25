export interface SuccessResponse {
  results: Results
}

export interface ErrorResponse {
  error: number
  message: string
}

export interface Results {
  'opensearch:Query': OpenSearchQuery
  'opensearch:totalResults': string
  'opensearch:startIndex': string
  'opensearch:itemsPerPage': string
  albummatches: AlbumMatches
  '@attr': Attribute
}

export interface Attribute {
  for: string
}

export interface AlbumMatches {
  album: Album[]
}

export interface Album {
  name: string
  artist: string
  url: string
  image: Image[]
  streamable: string
  mbid: string
}

export interface Image {
  '#text': string
  size: Size
}

export enum Size {
  ExtraLarge = 'extralarge',
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
}

export interface OpenSearchQuery {
  '#text': string
  role: string
  searchTerms: string
  startPage: string
}
