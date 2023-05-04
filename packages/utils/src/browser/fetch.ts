import type { ReplaceReturnType } from '../types'

export type Fetch = typeof fetch
export type Fetcher = ReplaceReturnType<Fetch, Promise<FetcherResponse>>
export type FetcherResponse = Response & { json: <T>() => Promise<T> }

export const fetcher =
  (fetch: Fetch): Fetcher =>
  async (...args: Parameters<Fetch>) => {
    const res = await fetch(...args)
    if (!res.ok) {
      const body = await res.text()
      console.error('Fetch failed', body)
      throw new Error('Fetch failed', { cause: res })
    }
    return res
  }
