export const makeRymUrl = (url: string): string => {
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `https://rateyourmusic.com${url}`
  return url
}

export const makeUserUrl = (username: string): string =>
  `https://rateyourmusic.com/~${username}`
