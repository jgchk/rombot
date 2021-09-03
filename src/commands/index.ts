import { Command } from '../types'
import album from './album'
import chart from './chart'
import cover from './cover'
import help from './help'
import latest from './latest'
import oomfie from './oomfie'
// import prefix from './prefix'
import rating from './rating'
import recent from './recent'
import set from './set'
import whoknowsalbum from './whoknowsalbum'

export const commands: Command[] = [
  set,
  album,
  latest,
  whoknowsalbum,
  recent,
  chart,
  cover,
  // prefix,
  help,
  rating,
  oomfie,
]
