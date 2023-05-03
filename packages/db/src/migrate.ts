import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate as drizzleMigrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'

import drizzleConfig from '../drizzle.config.json'

const migrationsFolder = path.resolve(path.join(__dirname, '../', drizzleConfig.out))

export const migrate = (db: BetterSQLite3Database) => drizzleMigrate(db, { migrationsFolder })
