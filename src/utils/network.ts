import Bottleneck from 'bottleneck'
import got from 'got'
import { REQUEST_TIMEOUT } from '../config'

export const limiter = new Bottleneck({
  reservoir: 30,
  reservoirRefreshAmount: 30,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 1,
  minTime: 1500,
})

export const gott = got.extend({ timeout: REQUEST_TIMEOUT })
