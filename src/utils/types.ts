import { Either, isRight } from 'fp-ts/Either'

export const isDefined = <T>(t: T | undefined): t is T => t !== undefined
export const isNotNull = <T>(t: T | null): t is T => t !== null

export const getRight = <L, R>(t: Either<L, R>): R | undefined =>
  isRight(t) ? t.right : undefined
