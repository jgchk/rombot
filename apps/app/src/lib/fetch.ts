export const fetcher =
  (fetch_: typeof fetch) =>
  async (...args: Parameters<typeof fetch>): Promise<Response & { json: <T>() => Promise<T> }> => {
    const res = await fetch_(...args)
    if (!res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body = await res.json()
      console.error('Fetch failed', body)
      throw new Error('Fetch failed', { cause: res })
    }
    return res
  }
