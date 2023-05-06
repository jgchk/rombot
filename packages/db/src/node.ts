import { drizzle } from 'drizzle-orm/node-postgres'
import type { PoolConfig } from 'pg'
import { Pool } from 'pg'

import { wrapDatabase } from './wrapper'

export type { Database } from './wrapper'

export const getNodeDatabase = (config: PoolConfig) => wrapDatabase(drizzle(new Pool(config)))
