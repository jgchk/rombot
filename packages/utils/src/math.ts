export const sum = (arr: number[]): number => {
  return arr.reduce((acc, cur) => acc + cur, 0)
}

export const isInRangeExclusive = (value: number, min: number, max: number): boolean => {
  return value > min && value < max
}

export const isInOneOfRangesExclusive = (value: number, ranges: [number, number][]): boolean => {
  return ranges.some(([min, max]) => isInRangeExclusive(value, min, max))
}

export const numDigits = (x: number) => {
  return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1
}

// generate a random integer between min and max (inclusive)
export const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
