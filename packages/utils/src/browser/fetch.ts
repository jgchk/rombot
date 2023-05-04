export type Fetch = typeof fetch

export const fetcher =
  (fetch: Fetch) =>
  async (...args: Parameters<Fetch>): Promise<Response & { json: <T>() => Promise<T> }> => {
    const res = await fetch(...args)
    if (!res.ok) {
      const body = await res.text()
      console.error('Fetch failed', body)
      throw new Error('Fetch failed', { cause: res })
    }
    return res
  }
