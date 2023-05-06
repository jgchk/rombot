import type { Fetcher } from 'utils/browser'
import { z } from 'zod'

export type ChartEntry = z.infer<typeof ChartEntry>
export const ChartEntry = z.object({
  imageUrl: z.string().optional(),
  title: z.string(),
  artist: z.string(),
  rating: z.number().min(1).max(10).optional(),
})

export type Chart = z.infer<typeof Chart>
export const Chart = z.object({
  entries: ChartEntry.array().min(1).max(25),
  rows: z.number().min(1).max(25).optional(),
  cols: z.number().min(1).max(25).optional(),
  coverSize: z.number().min(100).max(800).optional(),
})

export const fetchChart = (fetch: Fetcher) => (chart: Chart) =>
  fetch('https://charts-jgchk.vercel.app/api/chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chart),
  }).then((res) => res.blob())
