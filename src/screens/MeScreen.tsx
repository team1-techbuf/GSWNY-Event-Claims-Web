import { useMemo, useState } from 'react'
import type { AppUser, JoinedEvent, SlotType } from '../api'
import { AppLogo } from '../components/AppLogo'
import { CheckCircleIcon, PersonIcon } from '../components/Icons'
import {
  coverageLabel,
  formatDisplayDate,
  formatTimeRange,
  myClaim,
} from '../lib/events'

interface MeScreenProps {
  appUser: AppUser
  events: JoinedEvent[]
  busy: boolean
  onDrop: (eventId: string, slot: SlotType) => void
  onComplete: (eventId: string, leadCardsCount: number | null, followupNotes: string) => void
  onSignOut: () => void
}

export function MeScreen({ appUser, events, busy, onDrop, onComplete, onSignOut }: MeScreenProps) {
  const myEvents = useMemo(() => {
    return events
      .filter((event) => {
        const mine = myClaim(event, appUser.email)
        return mine.staff || mine.volunteer
      })
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  }, [events, appUser.email])

  return (
    <section className="screen with-bottom-nav me-screen">
      <header className="top-bar profile-top">
        <AppLogo compact />
        <button type="button" className="text-link" onClick={onSignOut}>
          Log Out
        </button>
      </header>

      <div className="profile-avatar" aria-hidden="true">
        <PersonIcon />
      </div>
      <h1>{appUser.fullName || 'Girl Scouts Member'}</h1>
      <p className="profile-role">{roleLabel(appUser.role)}</p>

      <dl className="profile-details">
        <div>
          <dt>Email</dt>
          <dd>{appUser.email}</dd>
        </div>
        {appUser.county && (
          <div>
            <dt>County</dt>
            <dd>{appUser.county}</dd>
          </div>
        )}
        {appUser.suNumber && (
          <div>
            <dt>Service Unit</dt>
            <dd>{appUser.suNumber}</dd>
          </div>
        )}
      </dl>

      <h2 className="section-heading">My Events</h2>
      {myEvents.length === 0 ? (
        <p className="empty-state">You haven&apos;t claimed any events yet.</p>
      ) : (
        <div className="my-events">
          {myEvents.map((event) => (
            <MyEventItem
              key={event.eventId}
              event={event}
              email={appUser.email}
              busy={busy}
              onDrop={onDrop}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

interface MyEventItemProps {
  event: JoinedEvent
  email: string
  busy: boolean
  onDrop: (eventId: string, slot: SlotType) => void
  onComplete: (eventId: string, leadCardsCount: number | null, followupNotes: string) => void
}

function MyEventItem({ event, email, busy, onDrop, onComplete }: MyEventItemProps) {
  const mine = myClaim(event, email)
  const slot: SlotType = mine.volunteer ? 'volunteer' : 'staff'
  const [expanded, setExpanded] = useState(false)
  const [leadCards, setLeadCards] = useState(
    event.leadCardsCount === null ? '' : String(event.leadCardsCount),
  )
  const [notes, setNotes] = useState(event.followupNotes ?? '')

  const isCompleted = event.status === 'completed'
  const isCancelled = event.status === 'cancelled'

  function handleComplete(submit: React.FormEvent) {
    submit.preventDefault()
    const trimmed = leadCards.trim()
    const count = trimmed === '' ? null : Number(trimmed)
    if (count !== null && (!Number.isFinite(count) || count < 0)) {
      return
    }
    onComplete(event.eventId, count, notes.trim())
    setExpanded(false)
  }

  return (
    <article className={isCompleted ? 'my-event completed' : 'my-event'}>
      <div className="my-event-head">
        <h3>{event.school?.schoolName ?? event.eventType}</h3>
        <span className="my-event-slot">{slot}</span>
      </div>
      <p className="my-event-meta">
        {formatDisplayDate(event.eventDate)} · {formatTimeRange(event)}
      </p>
      <span className={`coverage-tag coverage-${event.availability.coverageStatus}`}>
        {coverageLabel(event)}
      </span>

      {isCompleted ? (
        <div className="completed-summary">
          <p className="completed-flag">
            <CheckCircleIcon /> Completed
          </p>
          {event.leadCardsCount !== null && <p>Lead cards: {event.leadCardsCount}</p>}
          {event.followupNotes && <p className="completed-notes">{event.followupNotes}</p>}
        </div>
      ) : (
        <div className="my-event-actions">
          {!isCancelled && (
            <button
              className="pill-button pill-drop"
              type="button"
              disabled={busy}
              onClick={() => onDrop(event.eventId, slot)}
            >
              Drop
            </button>
          )}
          {!isCancelled && (
            <button
              className="pill-button pill-claim"
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? 'Cancel' : 'Mark completed'}
            </button>
          )}
        </div>
      )}

      {expanded && !isCompleted && (
        <form className="completion-form" onSubmit={handleComplete}>
          <label>
            <span># of lead cards</span>
            <input
              className="text-field"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="e.g. 12"
              value={leadCards}
              onChange={(input) => setLeadCards(input.target.value)}
            />
          </label>
          <label>
            <span>Additional notes</span>
            <textarea
              className="text-field textarea"
              rows={3}
              placeholder="How did the event go?"
              value={notes}
              onChange={(input) => setNotes(input.target.value)}
            />
          </label>
          <button className="primary-button full-button" type="submit" disabled={busy}>
            Save & complete
          </button>
        </form>
      )}
    </article>
  )
}

function roleLabel(role: AppUser['role']): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'staff':
      return 'Staff Member'
    default:
      return 'Volunteer'
  }
}
