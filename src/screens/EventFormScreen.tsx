import { useState } from 'react'
import type { CreateEventPayload, JoinedEvent, School } from '../api'
import { AppLogo } from '../components/AppLogo'
import { dayOfWeekFromDate, parseStartHour } from '../lib/events'

const EVENT_TYPES = ['Open House', 'Recruitment Night', 'Info Table', 'Other']

interface EventFormScreenProps {
  schools: School[]
  initial: JoinedEvent | null
  busy: boolean
  onSubmit: (payload: CreateEventPayload) => void
  onCancel: () => void
}

// "5:00 PM" -> "17:00" for a <input type="time">
function toInputTime(display: string): string {
  if (!display) {
    return ''
  }
  const hour = parseStartHour(display)
  if (hour === null) {
    return ''
  }
  const minuteMatch = /:(\d{2})/.exec(display)
  const minutes = minuteMatch ? minuteMatch[1] : '00'
  return `${String(hour).padStart(2, '0')}:${minutes}`
}

// "17:00" -> "5:00 PM"
function toDisplayTime(input: string): string {
  if (!input) {
    return ''
  }
  const [hourStr, minuteStr] = input.split(':')
  let hour = Number(hourStr)
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) {
    hour = 12
  } else if (hour > 12) {
    hour -= 12
  }
  return `${hour}:${minuteStr ?? '00'} ${meridiem}`
}

export function EventFormScreen({ schools, initial, busy, onSubmit, onCancel }: EventFormScreenProps) {
  const isEdit = initial !== null
  const [schoolId, setSchoolId] = useState(initial?.school?.schoolId ?? schools[0]?.schoolId ?? '')
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? '')
  const [startTime, setStartTime] = useState(toInputTime(initial?.startTime ?? ''))
  const [endTime, setEndTime] = useState(toInputTime(initial?.endTime ?? ''))
  const [timeNotes, setTimeNotes] = useState(initial?.timeNotes ?? '')
  const [eventType, setEventType] = useState(initial?.eventType ?? EVENT_TYPES[0])
  const [arrivalNotes, setArrivalNotes] = useState(initial?.arrivalNotes ?? '')
  const [needsStaff, setNeedsStaff] = useState(initial?.needsStaff ?? true)
  const [needsVolunteer, setNeedsVolunteer] = useState(initial?.needsVolunteer ?? true)
  const [status, setStatus] = useState(initial?.status ?? 'draft')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!schoolId) {
      setError('Please choose a school.')
      return
    }
    if (!eventDate) {
      setError('Please choose a date.')
      return
    }
    if (!startTime) {
      setError('Please set a start time.')
      return
    }
    onSubmit({
      schoolId,
      eventDate,
      dayOfWeek: dayOfWeekFromDate(eventDate),
      startTime: toDisplayTime(startTime),
      endTime: toDisplayTime(endTime),
      timeNotes: timeNotes.trim(),
      eventType,
      arrivalNotes: arrivalNotes.trim(),
      needsStaff,
      needsVolunteer,
      status,
    })
  }

  return (
    <section className="screen add-event-screen">
      <header className="top-bar">
        <AppLogo compact />
      </header>
      <h1>{isEdit ? 'Edit Event' : 'New Event'}</h1>

      <form className="event-form" onSubmit={handleSubmit}>
        <label className="event-field">
          <span>School</span>
          <select
            className="text-field"
            value={schoolId}
            onChange={(input) => setSchoolId(input.target.value)}
          >
            {schools.map((school) => (
              <option key={school.schoolId} value={school.schoolId}>
                {school.schoolName} ({school.cityTown} {school.zipCode})
              </option>
            ))}
          </select>
        </label>

        <label className="event-field">
          <span>Event Type</span>
          <select
            className="text-field"
            value={eventType}
            onChange={(input) => setEventType(input.target.value)}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="event-field">
          <span>Date</span>
          <input
            className="text-field"
            type="date"
            value={eventDate}
            onChange={(input) => setEventDate(input.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="event-field">
            <span>Start</span>
            <input
              className="text-field"
              type="time"
              value={startTime}
              onChange={(input) => setStartTime(input.target.value)}
            />
          </label>
          <label className="event-field">
            <span>End</span>
            <input
              className="text-field"
              type="time"
              value={endTime}
              onChange={(input) => setEndTime(input.target.value)}
            />
          </label>
        </div>

        <label className="event-field">
          <span>Time Notes</span>
          <input
            className="text-field"
            placeholder="e.g. End time TBD"
            value={timeNotes}
            onChange={(input) => setTimeNotes(input.target.value)}
          />
        </label>

        <label className="event-field">
          <span>Arrival Notes</span>
          <input
            className="text-field"
            placeholder="e.g. Check in at main office"
            value={arrivalNotes}
            onChange={(input) => setArrivalNotes(input.target.value)}
          />
        </label>

        <div className="checkbox-row">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={needsStaff}
              onChange={(input) => setNeedsStaff(input.target.checked)}
            />
            <span>Needs staff</span>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={needsVolunteer}
              onChange={(input) => setNeedsVolunteer(input.target.checked)}
            />
            <span>Needs volunteer</span>
          </label>
        </div>

        <label className="event-field">
          <span>Status</span>
          <select
            className="text-field"
            value={status}
            onChange={(input) => setStatus(input.target.value)}
          >
            <option value="draft">Draft (hidden from volunteers)</option>
            <option value="open">Open (claimable)</option>
            {isEdit && <option value="completed">Completed</option>}
            {isEdit && <option value="cancelled">Cancelled</option>}
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="add-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Back
          </button>
          <button className="primary-button" type="submit" disabled={busy}>
            {isEdit ? 'Save' : 'Add Event'}
          </button>
        </div>
      </form>
    </section>
  )
}
