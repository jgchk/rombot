import { Schema, model } from 'mongoose'

export type PartialDate = {
  year: number
  month: string | null
  day: number | null
}

export const partialDateSchema = new Schema<PartialDate>({
  year: { type: Number, required: true },
  month: String,
  day: Number,
})

export const PartialDateModel = model<PartialDate>(
  'PartialDate',
  partialDateSchema
)
