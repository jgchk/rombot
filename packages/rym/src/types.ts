export type ReleaseRating = {
  rating: Rating
  release: PartialRelease
}

export type Rating = {
  username: string
  issueUrl: string
  date: FullDate
  rating: number | null
  ownership: string | null
  tags: Tag[] | null
}

export type FullDate = {
  year: number
  month: string
  day: number
}

export type PartialDate = {
  year: number
  month: string | null
  day: number | null
}

export type Tag = {
  text: string
  url: string
}

export type PartialRelease = {
  issueUrl: string
  title: string
  artists: Artist[]
  artistDisplayName: string | null
  releaseYear: number | null
  coverThumbnail: string | null
}

export type Artist = {
  name: string
  url: string
}

export type Release = {
  url: string
  combinedUrl: string
  issueUrls: string[]
  id: string
  title: string
  artists: Artist[]
  artistDisplayName: string | null
  type: string | null
  releaseDate: PartialDate | null
  cover: string | null
  rymRating: number | null
  numberRymRatings: number | null
  overallRank: number | null
  overallRankUrl: string | null
  yearRank: number | null
  yearRankUrl: string | null
  primaryGenres: Genre[] | null
  secondaryGenres: Genre[] | null
  descriptors: string[] | null
  tracks: Track[] | null
}

export type Genre = {
  name: string
  url: string
}

export type Track = {
  number: string
  title: string
  duration: string | null
}
