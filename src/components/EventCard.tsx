import type { JoinedEvent, SlotType, UserRole } from '../api'
import {
  coverageLabel,
  formatDisplayDate,
  formatTimeRange,
  myClaim,
} from '../lib/events'
import {
  AlertIcon,
  CalendarLineIcon,
  ClockIcon,
  EditIcon,
  LocationIcon,
} from './Icons'

interface EventCardProps {
  event: JoinedEvent
  role: UserRole
  email: string
  busy?: boolean
  onClaim?: (slot: SlotType) => void
  onDrop?: (slot: SlotType) => void
  onEdit?: () => void
  compact?: boolean
}

export function EventCard({
  event,
  role,
  email,
  busy = false,
  onClaim,
  onDrop,
  onEdit,
  compact = false,
}: EventCardProps) {
  const mine = myClaim(event, email)
  const canClaimVolunteer =
    (role === 'admin' || role === 'volunteer') && event.availability.volunteerSlotAvailable
  const canClaimStaff =
    (role === 'admin' || role === 'staff') && event.availability.staffSlotAvailable
  const coverageClass = `coverage-tag coverage-${event.availability.coverageStatus}`

  return (
    <article className={compact ? 'event-card compact' : 'event-card'}>
      {event.priority && (
        <span className="priority-badge">
          <AlertIcon />
          {event.daysUntilEvent === 0
            ? 'Needs coverage today'
            : `Needs coverage in ${event.daysUntilEvent}d`}
        </span>
      )}
      <div className="event-card-title">
        <LocationIcon />
        <h3>{event.school?.schoolName ?? event.eventType}</h3>
        {onEdit && (
          <button
            type="button"
            className="icon-button card-edit"
            onClick={onEdit}
            aria-label="Edit event"
          >
            <EditIcon />
          </button>
        )}
      </div>
      <div className="event-card-date">
        <CalendarLineIcon />
        <span>{formatDisplayDate(event.eventDate)}</span>
      </div>
      <div className="event-card-date">
        <ClockIcon />
        <span>{formatTimeRange(event)}</span>
      </div>

      {!compact && event.school && (
        <p className="event-meta">
          {event.eventType}
          {event.school.cityTown ? ` · ${event.school.cityTown}` : ''}
          {event.school.zipCode ? ` ${event.school.zipCode}` : ''}
          {event.school.suNumber ? ` · SU ${event.school.suNumber}` : ''}
        </p>
      )}

      <span className={coverageClass}>{coverageLabel(event)}</span>

      {!compact && (
        <div className="claim-lines">
          <ClaimLine
            label="Staff"
            needed={event.needsStaff}
            claim={event.staffClaim}
            mine={mine.staff}
          />
          <ClaimLine
            label="Volunteer"
            needed={event.needsVolunteer}
            claim={event.volunteerClaim}
            mine={mine.volunteer}
          />
        </div>
      )}

      <div className="card-actions">
        {mine.volunteer && onDrop && (
          <button
            className="pill-button pill-drop"
            type="button"
            disabled={busy}
            onClick={() => onDrop('volunteer')}
          >
            Drop volunteer
          </button>
        )}
        {mine.staff && onDrop && (
          <button
            className="pill-button pill-drop"
            type="button"
            disabled={busy}
            onClick={() => onDrop('staff')}
          >
            Drop staff
          </button>
        )}
        {canClaimVolunteer && !mine.volunteer && onClaim && (
          <button
            className="pill-button pill-claim"
            type="button"
            disabled={busy}
            onClick={() => onClaim('volunteer')}
          >
            Claim volunteer
          </button>
        )}
        {canClaimStaff && !mine.staff && onClaim && (
          <button
            className="pill-button pill-claim"
            type="button"
            disabled={busy}
            onClick={() => onClaim('staff')}
          >
            Claim staff
          </button>
        )}
      </div>
    </article>
  )
}

interface ClaimLineProps {
  label: string
  needed: boolean
  claim: JoinedEvent['staffClaim']
  mine: boolean
}

function ClaimLine({ label, needed, claim, mine }: ClaimLineProps) {
  if (!needed) {
    return null
  }
  return (
    <div className={mine ? 'claim-line mine' : 'claim-line'}>
      <strong>{label}:</strong>{' '}
      {claim ? (
        <span>{mine ? 'You' : claim.userName || claim.userEmail}</span>
      ) : (
        <span className="claim-open">Open</span>
      )}
    </div>
  )
}
