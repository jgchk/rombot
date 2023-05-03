export function regexLastIndexOf(str: string, regex: RegExp) {
  const matches = str.match(regex)
  if (!matches) {
    return -1
  }
  const lastMatch = matches[matches.length - 1]
  return str.lastIndexOf(lastMatch)
}

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const undefIfEmpty = (str: string) => (str === '' ? undefined : str)
