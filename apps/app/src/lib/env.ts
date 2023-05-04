import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  APP_ID: z.string(),
  PUBLIC_KEY: z.string(),
  BOT_TOKEN: z.string(),
})

const envRes = envSchema.safeParse(process.env)

if (!envRes.success) {
  console.error('❌ Invalid environment variables', envRes)
  throw new Error('Invalid environment variables')
}

export const env = envRes.data
