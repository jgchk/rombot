import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate as drizzleMigrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'path'
import pg from 'pg'

import drizzleConfig from '../drizzle.config.json'

const migrationsFolder = path.resolve(path.join(__dirname, '../', drizzleConfig.out))

console.log(`Running migrations from ${migrationsFolder}`)

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is not defined')

console.log(`Connecting to ${DATABASE_URL}`)

const db = drizzle(new pg.Client({ connectionString: DATABASE_URL }), { logger: true })

drizzleMigrate(db, { migrationsFolder })
  .then(() => 'Ran migrations!')
  .catch((e) => console.error('Error migrating database', e))
