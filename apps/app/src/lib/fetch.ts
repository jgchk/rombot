export const fetcher =
  (fetch_: typeof fetch) =>
  async (...args: Parameters<typeof fetch>): Promise<Response & { json: <T>() => Promise<T> }> => {
    const res = await fetch_(...args)
    if (!res.ok) {
      throw new Error('Fetch failed', { cause: res })
    }
    return res
  }
