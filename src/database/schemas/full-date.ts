import { Schema, model } from 'mongoose'

export type FullDate = {
  year: number
  month: string
  day: number
}

export const fullDateSchema = new Schema<FullDate>({
  year: { type: Number, required: true },
  month: { type: String, required: true },
  day: { type: Number, required: true },
})

export const FullDateModel = model<FullDate>('FullDate', fullDateSchema)

export const compareFullDates = (a: FullDate, b: FullDate): number => {
  const yearComparison = a.year - b.year
  if (yearComparison !== 0) return yearComparison

  const aMonth = months[a.month] ?? 0
  const bMonth = months[b.month] ?? 0
  const monthComparison = aMonth - bMonth
  if (monthComparison !== 0) return monthComparison

  const dayComparison = a.day - b.day
  return dayComparison
}

const months: { [str: string]: number | undefined } = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}
