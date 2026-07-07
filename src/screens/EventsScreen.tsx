import { AppLogo } from '../components/AppLogo'
import { BottomNav } from '../components/BottomNav'
import { EventCard } from '../components/EventCard'
import { CalendarLineIcon, ListIcon, SearchIcon } from '../components/Icons'
import type { EventRecord, Screen } from '../types'

interface EventsScreenProps {
  events: EventRecord[]
  onNavigate: (screen: Screen) => void
}

export function EventsScreen({ events, onNavigate }: EventsScreenProps) {
  return (
    <section className="screen with-bottom-nav events-screen">
      <header className="top-bar">
        <AppLogo compact />
      </header>
      <div className="filter-row">
        <button type="button">Filter</button>
        <span className="hamburger" aria-hidden="true">
          =
        </span>
        <span className="zip">14770</span>
        <SearchIcon />
      </div>
      <div className="event-list">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      <button className="floating-add" type="button" onClick={() => onNavigate('add-event')}>
        <span aria-hidden="true">+</span>
        <small>Add Events</small>
      </button>
      <button className="view-toggle" type="button" onClick={() => onNavigate('calendar')} aria-label="Calendar view">
        <CalendarLineIcon />
        <ListIcon />
      </button>
      <BottomNav active="events" onNavigate={onNavigate} />
    </section>
  )
}
