import { Schema, model } from 'mongoose'

export type Tag = {
  text: string
  url: string
}

export const tagSchema = new Schema<Tag>({
  text: { type: String, required: true },
  url: { type: String, required: true },
})

export const TagModel = model<Tag>('Tag', tagSchema)
