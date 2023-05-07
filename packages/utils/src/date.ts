export const millisecondsInHour = 3600000

export const secondsInDay = 86400
export const secondsInWeek = 604800
export const secondsInMonth = 2592000

export const minutesInDay = 1440
export const minutesInMonth = 43200
export const minutesInYear = 525600

export const getTimeSinceShort = (date: Date) => {
  const milliseconds = new Date().getTime() - date.getTime()

  // 0 to 60 seconds
  const seconds = Math.round(milliseconds / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  // 1 to 60 minutes
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }

  // 1 to 24 hours
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours}h`
  }

  // 1 to 30 days
  const days = Math.round(minutes / minutesInDay)
  if (days < 30) {
    return `${days}d`
  }

  // 1 to 12 months
  const months = Math.round(minutes / minutesInMonth)
  if (months < 12) {
    return `${months}mo`
  }

  const years = Math.round(minutes / minutesInYear)
  return `${years}y`
}

const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' })
export const toPrettyDate = (date: Date) => {
  return formatter.format(date)
}

export const formatMilliseconds = (milliseconds: number) => {
  const seconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours === 0) {
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  } else {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(
      2,
      '0'
    )}`
  }
}

export const withinLastMinutes = (date: Date, minutes: number) => {
  return new Date().getTime() - date.getTime() < minutes * 60 * 1000
}

export const compareDates = (a: Date, b: Date) => {
  return a.getTime() - b.getTime()
}
