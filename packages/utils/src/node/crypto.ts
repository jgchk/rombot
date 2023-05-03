import type { BinaryLike } from 'crypto'
import { createHash } from 'crypto'

export const md5 = (content: BinaryLike) => createHash('md5').update(content).digest('hex')
