import { task } from 'fp-ts'

export const ifDefined =
  <T, O>(function_: (t: T) => O) =>
  (t: T | undefined): O | undefined =>
    t !== undefined ? function_(t) : undefined

export const ifNotNull =
  <T, O>(function_: (t: T) => O) =>
  (t: T | null): O | null =>
    t !== null ? function_(t) : null

export const voidTask: task.Task<void> = task.of(void 0)
// eslint-disable-next-line unicorn/no-useless-undefined
export const undefinedTask: task.Task<undefined> = task.of(undefined)
export const nullTask: task.Task<null> = task.of(null)
