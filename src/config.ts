import fs from 'fs'
import path from 'path'

const file = path.join(__dirname, '../config.json')
const config = JSON.parse(fs.readFileSync(file, 'utf8')) as {
  [key: string]: string | undefined
}

export const PREFIX = config.PREFIX ?? '.rym'
export const BOT_TOKEN = config.BOT_TOKEN
export const LASTFM_KEY = config.LASTFM_KEY
export const LASTFM_SECRET = config.LASTFM_SECRET
