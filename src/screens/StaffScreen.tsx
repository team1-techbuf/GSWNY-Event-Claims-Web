import { useMemo } from 'react'
import type { JoinedEvent, SlotType, UserRole } from '../api'
import { AppLogo } from '../components/AppLogo'
import { EventCard } from '../components/EventCard'
import { AlertIcon, BellIcon, PlusIcon } from '../components/Icons'
import { sortEvents } from '../lib/events'

interface StaffScreenProps {
  events: JoinedEvent[]
  role: UserRole
  email: string
  busy: boolean
  onClaim: (eventId: string, slot: SlotType) => void
  onDrop: (eventId: string, slot: SlotType) => void
  onAddEvent: () => void
  onEditEvent: (eventId: string) => void
  onNotify: (eventId: string) => void
  onPublish: (eventId: string) => void
}

export function StaffScreen({
  events,
  role,
  email,
  busy,
  onClaim,
  onDrop,
  onAddEvent,
  onEditEvent,
  onNotify,
  onPublish,
}: StaffScreenProps) {
  const sorted = useMemo(() => sortEvents(events), [events])
  const priorityEvents = sorted.filter((event) => event.priority)

  return (
    <section className="screen with-bottom-nav staff-screen">
      <header className="top-bar">
        <AppLogo compact />
      </header>
      <h1 className="staff-title">Staff Dashboard</h1>

      {priorityEvents.length > 0 && (
        <div className="priority-callout">
          <p className="priority-callout-head">
            <AlertIcon /> {priorityEvents.length} event
            {priorityEvents.length > 1 ? 's' : ''} need coverage within a week
          </p>
        </div>
      )}

      <div className="event-list staff-list">
        {sorted.map((event) => {
          const canNotify =
            event.status === 'open' && event.needsVolunteer && !event.volunteerClaim
          return (
            <div key={event.eventId} className="staff-event">
              <EventCard
                event={event}
                role={role}
                email={email}
                busy={busy}
                onClaim={(slot) => onClaim(event.eventId, slot)}
                onDrop={(slot) => onDrop(event.eventId, slot)}
                onEdit={() => onEditEvent(event.eventId)}
              />
              <div className="staff-toolbar">
                {event.status === 'draft' && (
                  <button
                    className="pill-button pill-claim"
                    type="button"
                    disabled={busy}
                    onClick={() => onPublish(event.eventId)}
                  >
                    Publish
                  </button>
                )}
                {canNotify && (
                  <button
                    className="pill-button pill-notify"
                    type="button"
                    disabled={busy}
                    onClick={() => onNotify(event.eventId)}
                  >
                    <BellIcon /> Notify volunteers
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button className="floating-add" type="button" onClick={onAddEvent}>
        <span aria-hidden="true">
          <PlusIcon />
        </span>
        <small>Add Event</small>
      </button>
    </section>
  )
}
