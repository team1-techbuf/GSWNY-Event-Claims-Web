import { AppLogo } from '../components/AppLogo'
import { BottomNav } from '../components/BottomNav'
import { CalendarLineIcon, ListIcon, SearchIcon } from '../components/Icons'
import type { EventRecord, Screen } from '../types'

interface CalendarScreenProps {
  events: EventRecord[]
  onNavigate: (screen: Screen) => void
}

const hours = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
const days = ['M', 'T', 'W', 'Th', 'F']

export function CalendarScreen({ events, onNavigate }: CalendarScreenProps) {
  return (
    <section className="screen with-bottom-nav calendar-screen">
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
      <p className="week-label">August 24-31st</p>
      <div className="calendar-grid">
        <div className="day-heading" />
        {days.map((day) => (
          <strong className="day-heading" key={day}>
            {day}
          </strong>
        ))}
        {hours.map((hour) => (
          <div className="time-row" key={hour}>
            <strong>{hour}</strong>
            <span />
          </div>
        ))}
        {events.slice(0, 2).map((event) => (
          <button
            className={`calendar-event ${event.color}`}
            key={event.id}
            type="button"
            style={
              {
                '--event-column': String(event.dayColumn + 1),
                '--event-start': String(event.startHour - 9),
                '--event-span': String(event.durationHours),
              } as React.CSSProperties
            }
          >
            Open House
          </button>
        ))}
      </div>
      <button className="floating-add" type="button" onClick={() => onNavigate('add-event')}>
        <span aria-hidden="true">+</span>
        <small>Add Events</small>
      </button>
      <button className="view-toggle" type="button" onClick={() => onNavigate('events')} aria-label="List view">
        <CalendarLineIcon />
        <ListIcon />
      </button>
      <BottomNav active="events" onNavigate={onNavigate} />
    </section>
  )
}
