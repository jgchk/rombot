export const ifDefined =
  <T, O>(function_: (t: T) => O) =>
  (t: T | undefined): O | undefined =>
    t !== undefined ? function_(t) : undefined

export const ifNotNull =
  <T, O>(function_: (t: T) => O) =>
  (t: T | null): O | null =>
    t !== null ? function_(t) : null
