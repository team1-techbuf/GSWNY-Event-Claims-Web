import { useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { BottomNav } from '../components/BottomNav'
import type { EventRecord, NewEventDraft, Screen } from '../types'

interface AddEventScreenProps {
  onAddEvent: (event: EventRecord) => void
  onNavigate: (screen: Screen) => void
}

const initialDraft: NewEventDraft = {
  location: '',
  date: '',
  time: '',
  description: '',
  roles: '',
}

export function AddEventScreen({ onAddEvent, onNavigate }: AddEventScreenProps) {
  const [draft, setDraft] = useState(initialDraft)

  function updateDraft(field: keyof NewEventDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit() {
    const title = draft.location || 'NEW EVENT LOCATION'
    const date = draft.date || '09/03/2024'
    onAddEvent({
      id: `event-${Date.now()}`,
      title: title.toUpperCase(),
      date,
      displayDate: date,
      time: draft.time || 'AM-PM',
      volunteerText: draft.roles || 'Volunteers Needed',
      location: title,
      color: 'teal',
      dayColumn: 4,
      startHour: 12,
      durationHours: 2,
    })
    setDraft(initialDraft)
    onNavigate('events')
  }

  return (
    <section className="screen with-bottom-nav add-event-screen">
      <header className="top-bar">
        <AppLogo compact />
      </header>
      <h1>New Event</h1>
      <form className="event-form" onSubmit={(event) => event.preventDefault()}>
        <Field
          label="Location:"
          placeholder="Address"
          value={draft.location}
          onChange={(value) => updateDraft('location', value)}
        />
        <Field
          label="Date:"
          placeholder="MM/DD/YY"
          value={draft.date}
          onChange={(value) => updateDraft('date', value)}
        />
        <Field
          label="Time:"
          placeholder="AM-PM"
          value={draft.time}
          onChange={(value) => updateDraft('time', value)}
        />
        <Field
          label="What is the event?:"
          placeholder="Description"
          value={draft.description}
          onChange={(value) => updateDraft('description', value)}
        />
        <Field
          label="Needed Roles:"
          placeholder="Volunteers/ Staff"
          value={draft.roles}
          onChange={(value) => updateDraft('roles', value)}
        />
      </form>
      <div className="add-actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate('events')}>
          Back
        </button>
        <button className="primary-button" type="button" onClick={handleSubmit}>
          Add Event
        </button>
      </div>
      <BottomNav active="events" onNavigate={onNavigate} />
    </section>
  )
}

interface FieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

function Field({ label, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="event-field">
      <span>{label}</span>
      <input
        className="text-field"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
