import fs from 'fs'
import path from 'path'
import { pipe } from 'fp-ts/function'
import { ifDefined } from './utils/functional'

const file = path.join(__dirname, '../config.json')
const config = JSON.parse(fs.readFileSync(file, 'utf8')) as {
  [key: string]: string | undefined
}

export const BOT_TOKEN = config.BOT_TOKEN
export const LASTFM_KEY = config.LASTFM_KEY
export const LASTFM_SECRET = config.LASTFM_SECRET
export const REQUEST_TIMEOUT =
  pipe(config.REQUEST_TIMEOUT, ifDefined(parseInt)) || 10_000
export const RYM_USERNAME = config.RYM_USERNAME
export const RYM_PASSWORD = config.RYM_PASSWORD
