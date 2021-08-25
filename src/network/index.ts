import { Either, left, right } from 'fp-ts/Either'
import got, { RequestError, Response } from 'got'
import { REQUEST_TIMEOUT } from '../config'
import { Emitter } from './emitter'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class NetworkLimiter {
  emitter: Emitter
  listeners: {
    [id: string]:
      | ((response: Either<RequestError, Response<string>>) => void)
      | undefined
  }
  rate: number
  last: number

  constructor(rate = 1000) {
    this.emitter = new Emitter()
    this.listeners = {}
    this.rate = rate
    this.last = 0

    this.emitter.on('request', async (message, callback) => {
      while (Date.now() < this.last + this.rate) {
        await sleep(this.last + this.rate - Date.now())
      }
      this.last = Date.now()

      const { id, url } = message
      console.log(Date.now(), url)

      try {
        const response = await got(url, { timeout: REQUEST_TIMEOUT })

        const listener = this.listeners[id]
        if (listener !== undefined) listener(right(response))
      } catch (error) {
        if (error instanceof RequestError) {
          const listener = this.listeners[id]
          if (listener !== undefined) listener(left(error))
        } else {
          throw error
        }
      }

      callback()
    })
  }

  get(url: string): Promise<Either<RequestError, Response<string>>> {
    return new Promise((resolve) => {
      const { id } = this.emitter.emit({ topic: 'request', url })
      this.listeners[id] = (response) => {
        resolve(response)
        delete this.listeners[id]
      }
    })
  }
}

const network = new NetworkLimiter()
export default network

export { Response } from 'got'
