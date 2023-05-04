const { drizzle } = require('drizzle-orm/node-postgres')
const { migrate: drizzleMigrate } = require('drizzle-orm/node-postgres/migrator')
const path = require('path')
const pg = require('pg')

const migrationsFolder = path.resolve(path.join(__dirname, './migrations'))
console.log(`Running migrations from ${migrationsFolder}`)

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is not defined')

const db = drizzle(new pg.Pool({ connectionString: DATABASE_URL }), { logger: true })

drizzleMigrate(db, { migrationsFolder })
  .then(() => 'Ran migrations!')
  .catch((e) => console.error('Error migrating database', e))
