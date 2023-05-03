import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/node-postgres'

export const getDatabase = () => drizzle(sql)
