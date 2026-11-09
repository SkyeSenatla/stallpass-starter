import type { TradingDay } from '@/api/types'

// The API's lower-case day codes, in market order, and what people read.
// The market is closed on Sundays.
export const tradingDays: readonly TradingDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const dayLabels: Record<TradingDay, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
}

// "Monday, Wednesday and Saturday"
export function formatDays(days: readonly TradingDay[]): string {
  const names = tradingDays.filter((day) => days.includes(day)).map((day) => dayLabels[day])
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}
