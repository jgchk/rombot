import { either } from 'fp-ts'

export const isDefined = <T>(t: T | undefined): t is T => t !== undefined
export const isNotNull = <T>(t: T | null): t is T => t !== null

export const getRight = <L, R>(t: either.Either<L, R>): R | undefined =>
  either.isRight(t) ? t.right : undefined
