import { z } from 'zod'

const envSchema = z.object({
  APP_ID: z.string(),
  PUBLIC_KEY: z.string(),
  BOT_TOKEN: z.string(),
})

const envRes = envSchema.safeParse({
  APP_ID: process.env.APP_ID,
  PUBLIC_KEY: process.env.PUBLIC_KEY,
  BOT_TOKEN: process.env.BOT_TOKEN,
})

if (!envRes.success) {
  console.error('❌ Invalid environment variables', envRes.error)
  throw new Error('Invalid environment variables')
}

export const env = envRes.data
