export const isDefined = <T>(value: T | undefined): value is T => value !== undefined
export const ifDefined = <T, O>(value: T | undefined, fn: (value: T) => O): O | undefined => {
  if (isDefined(value)) {
    return fn(value)
  } else {
    return undefined
  }
}

export const isTruthy = <T>(value: T | undefined | null | false | 0 | '' | []): value is T =>
  !!value
export const ifTruthy = <T, O>(
  value: T | undefined | null | false | 0 | '' | [],
  fn: (value: T) => O
): O | undefined => {
  if (isTruthy(value)) {
    return fn(value)
  } else {
    return undefined
  }
}

export const isNotNull = <T>(value: T | null): value is T => value !== null
export const ifNotNull = <T, O>(value: T | null, fn: (value: T) => O): O | null => {
  if (isNotNull(value)) {
    return fn(value)
  } else {
    return null
  }
}

export const isNotNullOrUndefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined
export const ifNotNullOrUndefined = <T, O>(
  value: T | null | undefined,
  fn: (value: T) => O
): O | null | undefined => {
  if (isNotNullOrUndefined(value)) {
    return fn(value)
  } else {
    return value
  }
}

export type Timeout = ReturnType<typeof setTimeout>

export type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
export type DistributivePick<T, K extends keyof T> = T extends unknown ? Pick<T, K> : never

export type EmptyObject = Record<string, never>

type AllProperties<T> = { [K in keyof T]: T[K] }
type NoProperties<T> = { [K in keyof T]?: never }
export type AllOrNothing<T> = AllProperties<T> | NoProperties<T>

export type IsPropOptional<T, TypeIfTrue = true, TypeIfFalse = false> = undefined extends T
  ? TypeIfTrue
  : TypeIfFalse
export type AreAllPropsOptional<T, TypeIfTrue = true, TypeIfFalse = false> = AreAllPropsTrue<
  {
    [K in keyof Required<T>]: IsPropOptional<T[K], true, false>
  },
  TypeIfTrue,
  TypeIfFalse
>

type AllPropertiesTrue<T> = {
  [K in keyof T]: T[K] extends true ? true : false
}
export type AreAllPropsTrue<
  T,
  TypeIfTrue = true,
  TypeIfFalse = false
> = AllPropertiesTrue<T> extends { [K in keyof T]: true } ? TypeIfTrue : TypeIfFalse

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<TResult = any, TParams extends any[] = any[]> = new (
  ...params: TParams
) => TResult
