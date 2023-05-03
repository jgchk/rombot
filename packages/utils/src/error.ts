import { isObject } from './object'

export const hasMessage = (error: unknown): error is { message: string } =>
  isObject(error) && 'message' in error && typeof error.message === 'string'

export const toErrorString = (error: unknown) => {
  if (typeof error === 'string') {
    return error
  }

  if (hasMessage(error)) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error)
  }

  return String(error)
}

export const tryOr = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const tryOrElse = <T>(fn: () => T, fallback: () => T): T => {
  try {
    return fn()
  } catch {
    return fallback()
  }
}
