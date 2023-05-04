import { z } from 'zod'

const envSchema = z.object({
  APP_ID: z.string(),
  PUBLIC_KEY: z.string(),
  BOT_TOKEN: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_TOKEN: z.string(),
  RYM_BOT_USERNAME: z.string(),
  RYM_BOT_PASSWORD: z.string(),
})

const envRes = envSchema.safeParse({
  APP_ID: process.env.APP_ID,
  PUBLIC_KEY: process.env.PUBLIC_KEY,
  BOT_TOKEN: process.env.BOT_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TOKEN: process.env.REDIS_TOKEN,
  RYM_BOT_USERNAME: process.env.RYM_BOT_USERNAME,
  RYM_BOT_PASSWORD: process.env.RYM_BOT_PASSWORD,
})

if (!envRes.success) {
  console.error('❌ Invalid environment variables', envRes.error)
  throw new Error('Invalid environment variables')
}

export const env = envRes.data
