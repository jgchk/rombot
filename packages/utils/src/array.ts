export const groupBy = <T, O>(array: T[], fn: (item: T) => O): Map<O, T[]> =>
  array.reduce((map, item) => {
    const key = fn(item)
    const previous = map.get(key)
    if (!previous) {
      map.set(key, [item])
    } else {
      previous.push(item)
    }
    return map
  }, new Map<O, T[]>())

export const uniqBy = <T, O>(array: T[], key: (item: T) => O): T[] => {
  const seen = new Set<O>()
  return array.filter((item) => {
    const value = key(item)
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

export const uniq = <T>(array: T[]): T[] => {
  const seen = new Set<T>()
  return array.filter((item) => {
    if (seen.has(item)) {
      return false
    }
    seen.add(item)
    return true
  })
}

export const hasDuplicates = <T>(array: T[]): boolean => {
  const seen = new Set<T>()
  for (const item of array) {
    if (seen.has(item)) {
      return true
    }
    seen.add(item)
  }
  return false
}

export const equalsWithOrder = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

export const equalsWithoutOrder = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) {
    return false
  }
  const seen = new Set<T>()
  for (const item of a) {
    seen.add(item)
  }
  for (const item of b) {
    if (!seen.has(item)) {
      return false
    }
  }
  return true
}

export const withoutRuns = <T>(array: T[]): T[] => {
  const result = []
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== array[i + 1]) {
      result.push(array[i])
    }
  }
  return result
}
