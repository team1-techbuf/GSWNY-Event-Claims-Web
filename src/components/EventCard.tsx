import type { EventRecord } from '../types'
import { CalendarLineIcon, LocationIcon, PersonIcon } from './Icons'

interface EventCardProps {
  event: EventRecord
  compact?: boolean
}

export function EventCard({ event, compact = false }: EventCardProps) {
  return (
    <article className={compact ? 'event-card compact' : 'event-card'}>
      <div className="event-card-title">
        <LocationIcon />
        <h3>{event.title}</h3>
      </div>
      <div className="event-card-date">
        <CalendarLineIcon />
        <span>
          {event.displayDate}
          {!compact && ` ${event.time}`}
        </span>
      </div>
      {!compact && event.volunteerText && (
        <div className="event-card-people">
          <div className="avatar-pair" aria-hidden="true">
            <span>
              <PersonIcon />
            </span>
            <span>
              <PersonIcon />
            </span>
          </div>
          <span>{event.volunteerText}</span>
        </div>
      )}
      <button className="small-action" type="button">
        {compact ? 'Completed' : 'Learn More'}
      </button>
    </article>
  )
}
