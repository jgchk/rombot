import { Schema, model } from 'mongoose'

export type Cover = {
  issueUrl: string
  imageUrl: string
  image: Buffer
}

export const coverSchema = new Schema<Cover>({
  issueUrl: { type: String, required: true, index: true },
  imageUrl: { type: String, required: true, index: true },
  image: { type: Buffer, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '1h' },
  },
})

export const CoverModel = model<Cover>('Cover', coverSchema)
