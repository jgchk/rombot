import type { RedisConfigNodejs } from '@upstash/redis'
import { Redis } from '@upstash/redis'

export const getRedis = (opts: RedisConfigNodejs) => wrapRedis(new Redis(opts))

const wrapRedis = (redis: Redis) => ({
  setCookies: (username: string, cookies: string) => redis.set(`cookies:${username}`, cookies),
  getCookies: (username: string) => redis.get(`cookies:${username}`),
})
