import type { RedisConfigNodejs } from '@upstash/redis'
import { Redis as UpstashRedis } from '@upstash/redis'
import type { Release } from 'rym'
import { secondsInMonth } from 'utils'

export type Redis = ReturnType<typeof wrapRedis>

export const getRedis = (opts: RedisConfigNodejs) => wrapRedis(new UpstashRedis(opts))

const wrapRedis = (redis: UpstashRedis) => ({
  setCookies: (username: string, cookies: string) => redis.set(`cookies:${username}`, cookies),
  getCookies: (username: string) => redis.get(`cookies:${username}`),

  setRelease: (issueUrl: string, release: Release) =>
    redis.set(`release:${issueUrl}`, release, { ex: secondsInMonth }),
  getRelease: (issueUrl: string) => redis.get<Release>(`release:${issueUrl}`),
})
