import { Schema, model } from 'mongoose'

export type SearchResult = {
  query: string
  url: string
}

export const searchResultSchema = new Schema<SearchResult>({
  query: { type: String, required: true, index: true },
  url: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '1d' },
  },
})

export const SearchResultModel = model<SearchResult>(
  'SearchResult',
  searchResultSchema
)
