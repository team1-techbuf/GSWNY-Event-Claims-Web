import { useMemo, useState } from 'react'
import type { JoinedEvent, SlotType, UserRole } from '../api'
import { AppLogo } from '../components/AppLogo'
import { EventCard } from '../components/EventCard'
import { SeasonSummary } from '../components/SeasonSummary'
import { AlertIcon, BellIcon, EditIcon, PlusIcon } from '../components/Icons'
import { formatDisplayDate, formatTimeRange } from '../lib/events'

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

type Section = 'active' | 'completed'
type VolunteerFilter = 'all' | 'needs' | 'has'
type ActiveSort = 'soonest' | 'latest'
type CompletedSort = 'cards_desc' | 'cards_asc' | 'recent'

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
  const [section, setSection] = useState<Section>('active')
  const [volunteerFilter, setVolunteerFilter] = useState<VolunteerFilter>('all')
  const [activeSort, setActiveSort] = useState<ActiveSort>('soonest')
  const [completedSort, setCompletedSort] = useState<CompletedSort>('recent')

  const priorityCount = useMemo(
    () => events.filter((event) => event.priority).length,
    [events],
  )

  // Active = anything staff still manage (draft or open); completed is its own list.
  const activeEvents = useMemo(() => {
    const filtered = events
      .filter((event) => event.status === 'open' || event.status === 'draft')
      .filter((event) => {
        if (volunteerFilter === 'needs') {
          return event.needsVolunteer && !event.volunteerClaim
        }
        if (volunteerFilter === 'has') {
          return Boolean(event.volunteerClaim)
        }
        return true
      })
    return filtered.sort((a, b) =>
      activeSort === 'soonest'
        ? a.eventDate.localeCompare(b.eventDate)
        : b.eventDate.localeCompare(a.eventDate),
    )
  }, [events, volunteerFilter, activeSort])

  const completedEvents = useMemo(() => {
    const filtered = events.filter((event) => event.status === 'completed')
    return filtered.sort((a, b) => {
      if (completedSort === 'recent') {
        return b.eventDate.localeCompare(a.eventDate)
      }
      const aCards = a.leadCardsCount
      const bCards = b.leadCardsCount
      // Events without a recorded count sort to the bottom either way.
      if (aCards === null && bCards === null) return 0
      if (aCards === null) return 1
      if (bCards === null) return -1
      return completedSort === 'cards_desc' ? bCards - aCards : aCards - bCards
    })
  }, [events, completedSort])

  return (
    <section className="screen with-bottom-nav staff-screen">
      <header className="top-bar">
        <AppLogo compact />
      </header>
      <h1 className="staff-title">Staff Dashboard</h1>

      <SeasonSummary events={events} />

      {priorityCount > 0 && (
        <div className="priority-callout">
          <p className="priority-callout-head">
            <AlertIcon /> {priorityCount} event
            {priorityCount > 1 ? 's' : ''} need coverage within a week
          </p>
        </div>
      )}

      <div className="view-switch" role="tablist" aria-label="Event lists">
        <button
          type="button"
          className={section === 'active' ? 'view-seg active' : 'view-seg'}
          onClick={() => setSection('active')}
        >
          Active ({activeEvents.length})
        </button>
        <button
          type="button"
          className={section === 'completed' ? 'view-seg active' : 'view-seg'}
          onClick={() => setSection('completed')}
        >
          Completed ({completedEvents.length})
        </button>
      </div>

      {section === 'active' ? (
        <>
          <StaffControls label="Volunteers">
            <Chip active={volunteerFilter === 'all'} onClick={() => setVolunteerFilter('all')}>
              All
            </Chip>
            <Chip active={volunteerFilter === 'needs'} onClick={() => setVolunteerFilter('needs')}>
              Needs volunteers
            </Chip>
            <Chip active={volunteerFilter === 'has'} onClick={() => setVolunteerFilter('has')}>
              Has volunteers
            </Chip>
          </StaffControls>
          <StaffControls label="Sort by date">
            <Chip active={activeSort === 'soonest'} onClick={() => setActiveSort('soonest')}>
              Earliest date
            </Chip>
            <Chip active={activeSort === 'latest'} onClick={() => setActiveSort('latest')}>
              Furthest date
            </Chip>
          </StaffControls>

          <div className="event-list staff-list">
            {activeEvents.length === 0 ? (
              <p className="empty-state">No active events match these filters.</p>
            ) : (
              activeEvents.map((event) => {
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
              })
            )}
          </div>
        </>
      ) : (
        <>
          <StaffControls label="Sort">
            <Chip active={completedSort === 'recent'} onClick={() => setCompletedSort('recent')}>
              Most recent
            </Chip>
            <Chip active={completedSort === 'cards_desc'} onClick={() => setCompletedSort('cards_desc')}>
              Most lead cards
            </Chip>
            <Chip active={completedSort === 'cards_asc'} onClick={() => setCompletedSort('cards_asc')}>
              Fewest lead cards
            </Chip>
          </StaffControls>

          <div className="event-list staff-list">
            {completedEvents.length === 0 ? (
              <p className="empty-state">No completed events yet.</p>
            ) : (
              completedEvents.map((event) => (
                <CompletedEventCard
                  key={event.eventId}
                  event={event}
                  onEdit={() => onEditEvent(event.eventId)}
                />
              ))
            )}
          </div>
        </>
      )}

      <button className="floating-add" type="button" onClick={onAddEvent}>
        <span aria-hidden="true">
          <PlusIcon />
        </span>
        <small>Add Event</small>
      </button>
    </section>
  )
}

function StaffControls({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="staff-controls">
      <span className="staff-controls-label">{label}</span>
      <div className="chip-row">{children}</div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" className={active ? 'chip active' : 'chip'} onClick={onClick}>
      {children}
    </button>
  )
}

function CompletedEventCard({ event, onEdit }: { event: JoinedEvent; onEdit: () => void }) {
  const completedBy = event.volunteerClaim?.userName || event.staffClaim?.userName || null
  const leadCards = event.leadCardsCount ?? null
  return (
    <article className="completed-card">
      <div className="completed-card-head">
        <h3>{event.school?.schoolName ?? event.eventType}</h3>
        <button type="button" className="icon-button" onClick={onEdit} aria-label="Edit event">
          <EditIcon />
        </button>
      </div>
      <p className="completed-card-meta">
        {formatDisplayDate(event.eventDate)} · {formatTimeRange(event)}
        {completedBy ? ` · ${completedBy}` : ''}
      </p>
      <div className="completed-card-stats">
        <span className="lead-card-stat">
          <strong>{leadCards ?? '—'}</strong>
          {leadCards === 1 ? 'lead card' : 'lead cards'}
        </span>
      </div>
      {event.followupNotes ? (
        <p className="completed-card-notes">{event.followupNotes}</p>
      ) : (
        <p className="completed-card-notes muted">No additional notes.</p>
      )}
    </article>
  )
}
