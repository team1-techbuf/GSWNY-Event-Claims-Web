import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { JoinedEvent, School, SlotType, UserRole } from '../api'
import {
  coverageColor,
  coverageLabel,
  coverageUrgency,
  formatDisplayDate,
  formatTimeRange,
  myClaim,
  parseCoords,
} from '../lib/events'

interface MapViewProps {
  events: JoinedEvent[]
  role: UserRole
  email: string
  busy: boolean
  onClaim: (eventId: string, slot: SlotType) => void
  onDrop: (eventId: string, slot: SlotType) => void
}

interface SchoolGroup {
  school: School
  coords: [number, number]
  events: JoinedEvent[]
}

// Center of the WNY / Cattaraugus service area — fallback when nothing is plotted.
const DEFAULT_CENTER: [number, number] = [42.09, -78.43]

const LEGEND: { color: string; label: string }[] = [
  { color: coverageColor('uncovered'), label: 'Needs staff & volunteer' },
  { color: coverageColor('needs_staff'), label: 'Needs staff' },
  { color: coverageColor('needs_volunteer'), label: 'Needs volunteer' },
  { color: coverageColor('partially_covered'), label: 'Partially covered' },
  { color: coverageColor('fully_covered'), label: 'Fully covered' },
]

export function MapView({ events, role, email, busy, onClaim, onDrop }: MapViewProps) {
  const groups = useMemo<SchoolGroup[]>(() => {
    const map = new Map<string, SchoolGroup>()
    for (const event of events) {
      const coords = parseCoords(event.school)
      if (!event.school || !coords) {
        continue
      }
      const key = event.school.schoolId
      const existing = map.get(key)
      if (existing) {
        existing.events.push(event)
      } else {
        map.set(key, { school: event.school, coords, events: [event] })
      }
    }
    return [...map.values()]
  }, [events])

  const plotted = groups.reduce((sum, group) => sum + group.events.length, 0)
  const hidden = events.length - plotted
  const points = useMemo(() => groups.map((group) => group.coords), [groups])
  // Only re-fit the view when the set of plotted locations changes, not on
  // every data refresh (e.g. after a claim), so manual pan/zoom is preserved.
  const boundsKey = useMemo(() => points.map((point) => point.join(',')).join('|'), [points])

  return (
    <div className="map-wrap">
      <MapContainer center={DEFAULT_CENTER} zoom={9} scrollWheelZoom className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} boundsKey={boundsKey} />
        {groups.map((group) => {
          const top = group.events.reduce((a, b) =>
            coverageUrgency(b.availability.coverageStatus) > coverageUrgency(a.availability.coverageStatus)
              ? b
              : a,
          )
          const color = coverageColor(top.availability.coverageStatus)
          return (
            <CircleMarker
              key={group.school.schoolId}
              center={group.coords}
              radius={11}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.95 }}
            >
              <Popup>
                <div className="map-popup">
                  <strong className="map-popup-school">{group.school.schoolName}</strong>
                  <span className="map-popup-address">
                    {group.school.cityTown} {group.school.zipCode}
                  </span>
                  <ul className="map-popup-events">
                    {group.events.map((event) => (
                      <MapPopupEvent
                        key={event.eventId}
                        event={event}
                        role={role}
                        email={email}
                        busy={busy}
                        onClaim={onClaim}
                        onDrop={onDrop}
                      />
                    ))}
                  </ul>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="map-legend" aria-label="Map legend">
        {LEGEND.map((item) => (
          <span key={item.label} className="map-legend-item">
            <span className="map-legend-dot" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {hidden > 0 && (
        <p className="map-hidden-note">
          {hidden} event{hidden === 1 ? '' : 's'} without a mapped location {hidden === 1 ? 'is' : 'are'} hidden. Use the list view.
        </p>
      )}
      {groups.length === 0 && <p className="map-empty">No mapped events match your filters.</p>}
    </div>
  )
}

interface MapPopupEventProps {
  event: JoinedEvent
  role: UserRole
  email: string
  busy: boolean
  onClaim: (eventId: string, slot: SlotType) => void
  onDrop: (eventId: string, slot: SlotType) => void
}

function MapPopupEvent({ event, role, email, busy, onClaim, onDrop }: MapPopupEventProps) {
  const mine = myClaim(event, email)
  const canClaimVolunteer =
    (role === 'admin' || role === 'volunteer') && event.availability.volunteerSlotAvailable
  const canClaimStaff =
    (role === 'admin' || role === 'staff') && event.availability.staffSlotAvailable

  return (
    <li className="map-popup-event">
      <span className="map-popup-event-head">
        <span
          className="map-legend-dot"
          style={{ backgroundColor: coverageColor(event.availability.coverageStatus) }}
        />
        <span>{event.eventType}</span>
      </span>
      <span className="map-popup-event-meta">
        {formatDisplayDate(event.eventDate)} · {formatTimeRange(event)}
      </span>
      <span className="map-popup-event-status">{coverageLabel(event)}</span>
      <span className="map-popup-actions">
        {mine.volunteer && (
          <button type="button" disabled={busy} onClick={() => onDrop(event.eventId, 'volunteer')}>
            Drop volunteer
          </button>
        )}
        {mine.staff && (
          <button type="button" disabled={busy} onClick={() => onDrop(event.eventId, 'staff')}>
            Drop staff
          </button>
        )}
        {canClaimVolunteer && !mine.volunteer && (
          <button
            type="button"
            className="claim"
            disabled={busy}
            onClick={() => onClaim(event.eventId, 'volunteer')}
          >
            Claim volunteer
          </button>
        )}
        {canClaimStaff && !mine.staff && (
          <button
            type="button"
            className="claim"
            disabled={busy}
            onClick={() => onClaim(event.eventId, 'staff')}
          >
            Claim staff
          </button>
        )}
      </span>
    </li>
  )
}

// Fit the map to the plotted markers, and correct sizing after the container
// mounts (Leaflet needs a nudge when it initializes inside a flex layout).
function FitBounds({ points, boundsKey }: { points: [number, number][]; boundsKey: string }) {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 0)
    return () => window.clearTimeout(timer)
  }, [map])
  useEffect(() => {
    if (points.length === 0) {
      return
    }
    if (points.length === 1) {
      map.setView(points[0], 12)
      return
    }
    map.fitBounds(points, { padding: [40, 40] })
    // Refit only when the plotted locations change (boundsKey), not on every
    // render — so a claim/refresh doesn't reset the user's pan/zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, boundsKey])
  return null
}
