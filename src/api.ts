import type { User } from 'firebase/auth'

export type UserRole = 'admin' | 'staff' | 'volunteer'
export type SlotType = 'staff' | 'volunteer'

export interface AppUser {
  email: string
  fullName: string
  role: UserRole
  active: boolean
  county: string
  suNumber: string
}

export interface School {
  schoolId: string
  ces: string
  county: string
  suNumber: string
  schoolName: string
  street: string
  cityTown: string
  zipCode: string
  notes: string
}

export interface ClaimSummary {
  userEmail: string
  userName: string
  claimedAt: string
}

export interface JoinedEvent {
  eventId: string
  school: School | null
  eventDate: string
  dayOfWeek: string
  startTime: string
  endTime: string
  timeNotes: string
  eventType: string
  arrivalNotes: string
  needsStaff: boolean
  needsVolunteer: boolean
  status: string
  followupNotes: string
  leadCardsCount: number | null
  staffClaim: ClaimSummary | null
  volunteerClaim: ClaimSummary | null
  availability: {
    staffSlotAvailable: boolean
    volunteerSlotAvailable: boolean
    coverageStatus: string
  }
}

export interface CreateEventPayload {
  schoolId: string
  eventDate: string
  dayOfWeek: string
  startTime: string
  endTime: string
  timeNotes: string
  eventType: string
  arrivalNotes: string
  needsStaff: boolean
  needsVolunteer: boolean
  status: string
}

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export async function getMe(user: User): Promise<AppUser> {
  return apiRequest(user, '/me')
}

export async function getSchools(user: User): Promise<School[]> {
  return apiRequest(user, '/schools')
}

export async function getEvents(user: User): Promise<JoinedEvent[]> {
  return apiRequest(user, '/events')
}

export async function createEvent(
  user: User,
  payload: CreateEventPayload,
): Promise<JoinedEvent> {
  return apiRequest(user, '/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function claimSlot(
  user: User,
  eventId: string,
  slotType: SlotType,
): Promise<JoinedEvent> {
  return apiRequest(user, `/events/${eventId}/claims`, {
    method: 'POST',
    body: JSON.stringify({ slotType }),
  })
}

export async function cancelClaim(
  user: User,
  eventId: string,
  slotType: SlotType,
): Promise<JoinedEvent> {
  return apiRequest(user, `/events/${eventId}/claims/${slotType}`, {
    method: 'DELETE',
  })
}

async function apiRequest<T>(
  user: User,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await user.getIdToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })

  const payload = await readJson(response)
  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      getErrorMessage(payload) ?? `API request failed with ${response.status}`,
    )
  }

  return payload as T
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function getErrorMessage(payload: unknown): string | null {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error !== null &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return null
}
