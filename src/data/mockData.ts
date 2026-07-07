import type { EventRecord, Profile } from '../types'

export const profile: Profile = {
  name: 'Emily Carter',
  role: 'Staff Member',
  email: 'CarterEmily02@gmail.com',
  serviceUnit: '101',
}

export const initialEvents: EventRecord[] = [
  {
    id: 'portville-open-house',
    title: 'PORTVILLE ELEMENTARY SCHOOL',
    date: '2024-08-28',
    displayDate: '08/28/2024',
    time: '5-7 PM',
    volunteerText: 'Olivia & Sam Volunteered',
    location: 'Portville, NY',
    color: 'lavender',
    dayColumn: 1,
    startHour: 17,
    durationHours: 1,
  },
  {
    id: 'new-life-open-house',
    title: 'NEW LIFE CHRISTIAN SCHOOL',
    date: '2024-08-30',
    displayDate: '08/30/2024',
    time: '2-4 PM',
    volunteerText: 'Olivia (Staff) Volunteered',
    location: 'Olean, NY',
    color: 'teal',
    dayColumn: 3,
    startHour: 14,
    durationHours: 3,
  },
  {
    id: 'hinsdale-open-house',
    title: 'HINSDALE CENTRAL SCHOOL',
    date: '2024-08-29',
    displayDate: '08/29/2024',
    time: '5 PM',
    location: 'Hinsdale, NY',
    color: 'lavender',
    dayColumn: 2,
    startHour: 17,
    durationHours: 1,
  },
]
