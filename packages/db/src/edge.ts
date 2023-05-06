import type { PoolConfig } from '@neondatabase/serverless'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import { wrapDatabase } from './wrapper'

export type { Database } from './wrapper'

export const getEdgeDatabase = (config: PoolConfig) => wrapDatabase(drizzle(new Pool(config)))
