import { useMemo, useState } from 'react'
import type { JoinedEvent, SlotType, UserRole } from '../api'
import { AppLogo } from '../components/AppLogo'
import { CalendarView } from '../components/CalendarView'
import { EventCard } from '../components/EventCard'
import { FilterPanel } from '../components/FilterPanel'
import { MapView } from '../components/MapView'
import { CalendarLineIcon, FilterIcon, ListIcon, LocationIcon, PlusIcon } from '../components/Icons'
import {
  activeFilterCount,
  emptyFilters,
  filterEvents,
  sortEvents,
  type EventFilters,
} from '../lib/events'

interface EventsScreenProps {
  events: JoinedEvent[]
  role: UserRole
  email: string
  busy: boolean
  canManage: boolean
  onClaim: (eventId: string, slot: SlotType) => void
  onDrop: (eventId: string, slot: SlotType) => void
  onAddEvent: () => void
  onAddEventOnDate: (dateISO: string) => void
  onEditEvent: (eventId: string) => void
}

type View = 'list' | 'calendar' | 'map'

export function EventsScreen({
  events,
  role,
  email,
  busy,
  canManage,
  onClaim,
  onDrop,
  onAddEvent,
  onAddEventOnDate,
  onEditEvent,
}: EventsScreenProps) {
  const [filters, setFilters] = useState<EventFilters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<View>('list')

  const visible = useMemo(
    () => sortEvents(filterEvents(events, filters)),
    [events, filters],
  )
  const count = activeFilterCount(filters)

  return (
    <section className="screen with-bottom-nav events-screen">
      <header className="top-bar">
        <AppLogo compact />
      </header>

      <div className="filter-row">
        <button type="button" className="filter-toggle" onClick={() => setShowFilters((prev) => !prev)}>
          <FilterIcon />
          Filter{count ? ` (${count})` : ''}
        </button>
        <span className="results-count">{visible.length} events</span>
      </div>

      <div className="view-switch" role="tablist" aria-label="Event views">
        <button
          type="button"
          className={view === 'list' ? 'view-seg active' : 'view-seg'}
          onClick={() => setView('list')}
        >
          <ListIcon /> List
        </button>
        <button
          type="button"
          className={view === 'calendar' ? 'view-seg active' : 'view-seg'}
          onClick={() => setView('calendar')}
        >
          <CalendarLineIcon /> Calendar
        </button>
        <button
          type="button"
          className={view === 'map' ? 'view-seg active' : 'view-seg'}
          onClick={() => setView('map')}
        >
          <LocationIcon /> Map
        </button>
      </div>

      {showFilters && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />
      )}

      {view === 'map' ? (
        <MapView
          events={visible}
          role={role}
          email={email}
          busy={busy}
          onClaim={onClaim}
          onDrop={onDrop}
        />
      ) : view === 'calendar' ? (
        <CalendarView
          events={visible}
          role={role}
          email={email}
          busy={busy}
          canManage={canManage}
          onClaim={onClaim}
          onDrop={onDrop}
          onEditEvent={onEditEvent}
          onAddEventOnDate={onAddEventOnDate}
        />
      ) : visible.length === 0 ? (
        <p className="empty-state">No events match your filters.</p>
      ) : (
        <div className="event-list">
          {visible.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              role={role}
              email={email}
              busy={busy}
              onClaim={(slot) => onClaim(event.eventId, slot)}
              onDrop={(slot) => onDrop(event.eventId, slot)}
              onEdit={canManage ? () => onEditEvent(event.eventId) : undefined}
            />
          ))}
        </div>
      )}

      {canManage && (
        <button className="floating-add" type="button" onClick={onAddEvent}>
          <span aria-hidden="true">
            <PlusIcon />
          </span>
          <small>Add Event</small>
        </button>
      )}
    </section>
  )
}
