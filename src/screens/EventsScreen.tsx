import { useMemo, useState } from 'react'
import type { JoinedEvent, SlotType, UserRole } from '../api'
import { AppLogo } from '../components/AppLogo'
import { EventCard } from '../components/EventCard'
import { FilterPanel } from '../components/FilterPanel'
import { MapView } from '../components/MapView'
import { CalendarLineIcon, FilterIcon, ListIcon, LocationIcon, PlusIcon } from '../components/Icons'
import {
  activeFilterCount,
  emptyFilters,
  filterEvents,
  formatDisplayDate,
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
  onEditEvent: (eventId: string) => void
}

export function EventsScreen({
  events,
  role,
  email,
  busy,
  canManage,
  onClaim,
  onDrop,
  onAddEvent,
  onEditEvent,
}: EventsScreenProps) {
  const [filters, setFilters] = useState<EventFilters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'list' | 'agenda' | 'map'>('list')

  const visible = useMemo(
    () => sortEvents(filterEvents(events, filters)),
    [events, filters],
  )
  const count = activeFilterCount(filters)

  const grouped = useMemo(() => {
    const map = new Map<string, JoinedEvent[]>()
    for (const event of visible) {
      const list = map.get(event.eventDate) ?? []
      list.push(event)
      map.set(event.eventDate, list)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [visible])

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
          className={view === 'agenda' ? 'view-seg active' : 'view-seg'}
          onClick={() => setView('agenda')}
        >
          <CalendarLineIcon /> Agenda
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
      ) : visible.length === 0 ? (
        <p className="empty-state">No events match your filters.</p>
      ) : view === 'list' ? (
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
      ) : (
        <div className="event-list agenda">
          {grouped.map(([date, dayEvents]) => (
            <div key={date} className="agenda-day">
              <h3 className="agenda-date">{formatDisplayDate(date)}</h3>
              {dayEvents.map((event) => (
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
