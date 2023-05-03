export const mapValues = <K, V, O>(map: Map<K, V>, fn: (input: V) => O): Map<K, O> =>
  new Map(Array.from(map.entries()).map(([key, value]) => [key, fn(value)]))
