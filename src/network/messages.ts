export type MessageMap = {
  request: MessageRequest
}
export type Message = MessageMap[keyof MessageMap]
export type WithId<T> = T & { id: string }
export type WithOptionalId<T> = T & { id?: string }

type MessageRequest = {
  topic: 'request'
  url: string
}
