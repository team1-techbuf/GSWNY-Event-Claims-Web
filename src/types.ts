export type Screen = 'splash' | 'login' | 'search' | 'events' | 'calendar' | 'add-event' | 'profile'

export interface EventRecord {
  id: string
  title: string
  date: string
  displayDate: string
  time: string
  volunteerText?: string
  location: string
  color: 'teal' | 'lavender'
  dayColumn: number
  startHour: number
  durationHours: number
}

export interface Profile {
  name: string
  role: string
  email: string
  serviceUnit: string
}

export interface NewEventDraft {
  location: string
  date: string
  time: string
  description: string
  roles: string
}
