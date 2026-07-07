import type { JoinedEvent } from '../api'

export interface TimeBlock {
  id: string
  label: string
  startHour: number
  endHour: number
}

// Blocks of time used for filtering, e.g. "8am-12pm".
export const TIME_BLOCKS: TimeBlock[] = [
  { id: 'morning', label: '8am – 12pm', startHour: 8, endHour: 12 },
  { id: 'afternoon', label: '12pm – 4pm', startHour: 12, endHour: 16 },
  { id: 'evening', label: '4pm – 8pm', startHour: 16, endHour: 20 },
]

export const STATUS_OPTIONS = ['open', 'draft', 'completed', 'cancelled'] as const

export interface EventFilters {
  status: string
  zipCode: string
  serviceUnit: string
  date: string
  timeBlock: string
}

export const emptyFilters: EventFilters = {
  status: '',
  zipCode: '',
  serviceUnit: '',
  date: '',
  timeBlock: '',
}

export function activeFilterCount(filters: EventFilters): number {
  return Object.values(filters).filter((value) => value.trim() !== '').length
}

// Parse a display time like "5:00 PM" or "10 AM" into a 24-hour hour number.
export function parseStartHour(startTime: string): number | null {
  const match = /(\d{1,2})(?::(\d{2}))?\s*([APap][Mm])?/.exec(startTime.trim())
  if (!match) {
    return null
  }
  let hour = Number(match[1])
  if (Number.isNaN(hour)) {
    return null
  }
  const meridiem = match[3]?.toUpperCase()
  if (meridiem === 'PM' && hour !== 12) {
    hour += 12
  } else if (meridiem === 'AM' && hour === 12) {
    hour = 0
  }
  return hour
}

function matchesTimeBlock(event: JoinedEvent, blockId: string): boolean {
  const block = TIME_BLOCKS.find((item) => item.id === blockId)
  if (!block) {
    return true
  }
  const hour = parseStartHour(event.startTime)
  if (hour === null) {
    return false
  }
  return hour >= block.startHour && hour < block.endHour
}

export function filterEvents(events: JoinedEvent[], filters: EventFilters): JoinedEvent[] {
  const zip = filters.zipCode.trim().toLowerCase()
  const su = filters.serviceUnit.trim().toLowerCase()

  return events.filter((event) => {
    if (filters.status && event.status !== filters.status) {
      return false
    }
    if (zip && !(event.school?.zipCode ?? '').toLowerCase().includes(zip)) {
      return false
    }
    if (su && !(event.school?.suNumber ?? '').toLowerCase().includes(su)) {
      return false
    }
    if (filters.date && event.eventDate !== filters.date) {
      return false
    }
    if (filters.timeBlock && !matchesTimeBlock(event, filters.timeBlock)) {
      return false
    }
    return true
  })
}

// Priority events first, then upcoming by date, then everything else.
export function sortEvents(events: JoinedEvent[]): JoinedEvent[] {
  return [...events].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority ? -1 : 1
    }
    return a.eventDate.localeCompare(b.eventDate)
  })
}

export function coverageLabel(event: JoinedEvent): string {
  switch (event.availability.coverageStatus) {
    case 'uncovered':
      return 'Needs staff & volunteer'
    case 'needs_staff':
      return 'Needs staff'
    case 'needs_volunteer':
      return 'Needs volunteer'
    case 'partially_covered':
      return 'Partially covered'
    case 'fully_covered':
      return 'Fully covered'
    case 'not_needed':
      return 'No slots needed'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    case 'draft':
      return 'Draft'
    default:
      return event.availability.coverageStatus
  }
}

export function formatDisplayDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim())
  if (!match) {
    return isoDate
  }
  return `${match[2]}/${match[3]}/${match[1]}`
}

export function formatTimeRange(event: JoinedEvent): string {
  const parts = [event.startTime, event.endTime].filter(Boolean)
  return parts.join(' – ') || event.timeNotes || 'Time TBD'
}

export function dayOfWeekFromDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim())
  if (!match) {
    return ''
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    date.getUTCDay()
  ]
}

// Does the current user hold an active claim on either slot of this event?
export function myClaim(
  event: JoinedEvent,
  email: string,
): { staff: boolean; volunteer: boolean } {
  const normalized = email.trim().toLowerCase()
  return {
    staff: event.staffClaim?.userEmail.toLowerCase() === normalized,
    volunteer: event.volunteerClaim?.userEmail.toLowerCase() === normalized,
  }
}
