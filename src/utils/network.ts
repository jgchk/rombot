import Bottleneck from 'bottleneck'
import got from 'got'
import tunnel from 'tunnel'
import { REQUEST_TIMEOUT } from '../config'

export const limiter = new Bottleneck({
  reservoir: 30,
  reservoirRefreshAmount: 30,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 1,
  minTime: 1500,
})

export const gott = got.extend({
  agent: {
    http: tunnel.httpOverHttp({
      proxy: {
        host: '107.152.222.48',
        port: 9071,
        proxyAuth: 'dnfnaghh:xipbja6ob89m',
      },
    }),
  },
  timeout: REQUEST_TIMEOUT,
})
console.log(gott.defaults)
