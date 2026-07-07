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

// Marker/dot color for a coverage status. Distinguishes what a slot needs:
// red = needs both, blue = needs staff, orange = needs volunteer.
export function coverageColor(status: string): string {
  switch (status) {
    case 'uncovered':
      return '#b4331f' // red — needs staff AND volunteer
    case 'needs_staff':
      return '#1f5c8a' // blue — needs staff
    case 'needs_volunteer':
      return '#d98a00' // orange — needs volunteer
    case 'partially_covered':
      return '#8a6d00' // amber — one slot still open
    case 'fully_covered':
      return '#2f6a1e' // green — covered
    case 'completed':
      return '#4a7fa5'
    default:
      return '#8a8378' // gray — draft / cancelled / not needed
  }
}

// Higher = more urgent; used to pick a single color for a school that hosts
// multiple events.
export function coverageUrgency(status: string): number {
  switch (status) {
    case 'uncovered':
      return 4
    case 'needs_staff':
    case 'needs_volunteer':
      return 3
    case 'partially_covered':
      return 2
    case 'fully_covered':
      return 1
    default:
      return 0
  }
}

// Parse a school's stored lat/lng strings into a [lat, lng] tuple, or null if
// the school has no usable coordinates.
export function parseCoords(
  school: { latitude?: string; longitude?: string } | null,
): [number, number] | null {
  if (!school) {
    return null
  }
  const lat = Number.parseFloat(school.latitude ?? '')
  const lng = Number.parseFloat(school.longitude ?? '')
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }
  return [lat, lng]
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

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export interface SeasonSummaryStats {
  // Open events whose needed slots are all claimed, out of all open events.
  openCount: number
  coveredCount: number
  coveragePct: number | null // null when there are no open events yet
  // Lead cards recorded across the whole season.
  totalLeadCards: number
  // Events that have happened vs. events still to run (open or draft).
  completedCount: number
  remainingCount: number
}

export interface MonthlyLeadPoint {
  key: string // 'YYYY-MM', for sorting
  label: string // 'Aug', or "Aug '24" when the data spans multiple years
  leads: number
}

// Season-level rollup for the staff dashboard. "Covered" = an open event whose
// needed slots are all claimed; "remaining" = events still to run (open/draft).
// Cancelled events are ignored. It's a single pass over the events already loaded.
export function seasonSummary(events: JoinedEvent[]): SeasonSummaryStats {
  let openCount = 0
  let coveredCount = 0
  let totalLeadCards = 0
  let completedCount = 0
  let remainingCount = 0

  for (const event of events) {
    if (event.leadCardsCount !== null) {
      totalLeadCards += event.leadCardsCount
    }
    if (event.status === 'open') {
      openCount += 1
      if (event.availability.coverageStatus === 'fully_covered') {
        coveredCount += 1
      }
    }
    if (event.status === 'completed') {
      completedCount += 1
    }
    if (event.status === 'open' || event.status === 'draft') {
      remainingCount += 1
    }
  }

  return {
    openCount,
    coveredCount,
    coveragePct: openCount === 0 ? null : Math.round((coveredCount / openCount) * 100),
    totalLeadCards,
    completedCount,
    remainingCount,
  }
}

// Lead cards collected per calendar month, for the season line graph. Groups
// events with a recorded lead-card count by their event month and sums them,
// returned in chronological order.
export function monthlyLeads(events: JoinedEvent[]): MonthlyLeadPoint[] {
  const byMonth = new Map<string, number>()
  for (const event of events) {
    if (event.leadCardsCount === null) {
      continue
    }
    const match = /^(\d{4})-(\d{2})/.exec(event.eventDate.trim())
    if (!match) {
      continue
    }
    const key = `${match[1]}-${match[2]}`
    byMonth.set(key, (byMonth.get(key) ?? 0) + event.leadCardsCount)
  }

  const keys = [...byMonth.keys()].sort()
  const multiYear = new Set(keys.map((key) => key.slice(0, 4))).size > 1
  return keys.map((key) => {
    const [year, month] = key.split('-')
    const label = MONTH_LABELS[Number(month) - 1] ?? month
    return {
      key,
      label: multiYear ? `${label} '${year.slice(2)}` : label,
      leads: byMonth.get(key) ?? 0,
    }
  })
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
