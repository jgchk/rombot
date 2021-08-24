import mqEmitter, { MQEmitter } from 'mqemitter'
import { nanoid } from 'nanoid'
import { Message, MessageMap, WithId, WithOptionalId } from './messages'

export type EmitterOptions = {
  concurrency?: number
  matchEmptyLevels?: boolean
  separator?: string
  wildcardOne?: string
  wildcardSome?: string
}

type Listener<T extends keyof MessageMap> = (
  message: WithId<MessageMap[T]>,
  done: () => void
) => void | Promise<void>

export class Emitter {
  mq: MQEmitter

  constructor(options?: EmitterOptions) {
    this.mq = mqEmitter(options)
  }

  on<T extends keyof MessageMap>(
    topic: T,
    listener: Listener<T>,
    callback?: () => void
  ): Emitter {
    this.mq.on(topic, listener as never, callback)
    return this
  }

  emit<T extends Message>(
    message: WithOptionalId<T>,
    callback?: (error?: Error) => void
  ): WithId<T> {
    const message_: WithId<T> = { ...message, id: message.id ?? nanoid() }
    this.mq.emit(message_, callback)
    return message_
  }

  off<T extends keyof MessageMap>(
    topic: T,
    listener: Listener<T>,
    callback?: () => void
  ): void {
    this.mq.removeListener(topic, listener as never, callback)
  }

  close(callback: () => void): void {
    this.mq.close(callback)
  }
}
