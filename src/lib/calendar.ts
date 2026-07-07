// Calendar date/time helpers. Dates are handled as "YYYY-MM-DD" strings and
// compared at day granularity in UTC so the displayed day never shifts due to
// the viewer's timezone.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function isoToParts(iso: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!match) {
    return null
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function partsToISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function isoToUTC(iso: string): number | null {
  const parts = isoToParts(iso)
  if (!parts) {
    return null
  }
  return Date.UTC(parts[0], parts[1] - 1, parts[2])
}

function utcToISO(ms: number): string {
  const date = new Date(ms)
  return partsToISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

const DAY_MS = 24 * 60 * 60 * 1000

export function addDaysISO(iso: string, days: number): string {
  const ms = isoToUTC(iso)
  if (ms === null) {
    return iso
  }
  return utcToISO(ms + days * DAY_MS)
}

export function weekdayOf(iso: string): number {
  const ms = isoToUTC(iso)
  if (ms === null) {
    return 0
  }
  return new Date(ms).getUTCDay()
}

export function todayISO(): string {
  const now = new Date()
  return partsToISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

// Sunday-based start of the week containing `iso`.
export function startOfWeekISO(iso: string): string {
  return addDaysISO(iso, -weekdayOf(iso))
}

export function weekDays(startISO: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysISO(startISO, index))
}

// A 6-row month grid (42 ISO dates) starting on the Sunday on/before the 1st.
export function monthGrid(year: number, month: number): string[] {
  const first = partsToISO(year, month, 1)
  const gridStart = startOfWeekISO(first)
  return Array.from({ length: 42 }, (_, index) => addDaysISO(gridStart, index))
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = month - 1 + delta
  const nextYear = year + Math.floor(zeroBased / 12)
  const nextMonth = ((zeroBased % 12) + 12) % 12
  return { year: nextYear, month: nextMonth + 1 }
}

export function monthOf(iso: string): { year: number; month: number } {
  const parts = isoToParts(iso)
  if (!parts) {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }
  return { year: parts[0], month: parts[1] }
}

export function dayNumber(iso: string): number {
  const parts = isoToParts(iso)
  return parts ? parts[2] : 0
}

export function isInMonth(iso: string, year: number, month: number): boolean {
  const parts = isoToParts(iso)
  return Boolean(parts && parts[0] === year && parts[1] === month)
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export function formatWeekRange(startISO: string): string {
  const endISO = addDaysISO(startISO, 6)
  const start = isoToParts(startISO)
  const end = isoToParts(endISO)
  if (!start || !end) {
    return ''
  }
  const startLabel = `${MONTH_NAMES[start[1] - 1].slice(0, 3)} ${start[2]}`
  const endLabel =
    start[1] === end[1]
      ? `${end[2]}`
      : `${MONTH_NAMES[end[1] - 1].slice(0, 3)} ${end[2]}`
  const yearLabel = start[0] === end[0] ? start[0] : `${start[0]}/${end[0]}`
  return `${startLabel} – ${endLabel}, ${yearLabel}`
}

export const WEEKDAY_LABELS = WEEKDAY_SHORT

const WEEKDAY_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

export function formatLongDate(iso: string): string {
  const parts = isoToParts(iso)
  if (!parts) {
    return iso
  }
  return `${WEEKDAY_FULL[weekdayOf(iso)]}, ${MONTH_NAMES[parts[1] - 1]} ${parts[2]}`
}

// Parse a display time like "5:00 PM" / "10 AM" into decimal hours (17, 10),
// or null when it can't be read.
export function parseTimeDecimal(value: string): number | null {
  const match = /(\d{1,2})(?::(\d{2}))?\s*([APap][Mm])?/.exec(value.trim())
  if (!match) {
    return null
  }
  let hour = Number(match[1])
  if (Number.isNaN(hour)) {
    return null
  }
  const minutes = match[2] ? Number(match[2]) : 0
  const meridiem = match[3]?.toUpperCase()
  if (meridiem === 'PM' && hour !== 12) {
    hour += 12
  } else if (meridiem === 'AM' && hour === 12) {
    hour = 0
  }
  return hour + minutes / 60
}
