export const withUrlUpdate = (url: URL, update: (url: URL) => void) => {
  const newUrl = new URL(url)
  update(newUrl)
  return newUrl
}

export const toRelativeUrl = (url: URL) => {
  return url.pathname + url.search + url.hash
}
