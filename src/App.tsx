import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import './App.css'
import {
  ApiRequestError,
  cancelClaim,
  claimSlot,
  createEvent,
  getEvents,
  getMe,
  getSchools,
} from './api'
import type { AppUser, CreateEventPayload, JoinedEvent, School, SlotType } from './api'
import { auth } from './firebase'

const emptyEventForm: CreateEventPayload = {
  schoolId: '',
  eventDate: '',
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  timeNotes: '',
  eventType: 'Open House',
  arrivalNotes: '',
  needsStaff: true,
  needsVolunteer: true,
  status: 'draft',
}

function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [events, setEvents] = useState<JoinedEvent[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [eventForm, setEventForm] = useState(emptyEventForm)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setAuthLoading(false)
      setAppUser(null)
      setEvents([])
      setSchools([])
      setMessage('')
    })
  }, [])

  useEffect(() => {
    if (!firebaseUser) {
      return
    }

    let cancelled = false

    async function loadAppData(user: User) {
      setDataLoading(true)
      setMessage('')
      try {
        const [me, schoolList, eventList] = await Promise.all([
          getMe(user),
          getSchools(user),
          getEvents(user),
        ])
        if (cancelled) {
          return
        }
        setAppUser(me)
        setSchools(schoolList)
        setEvents(eventList)
        if (schoolList[0]) {
          setEventForm((current) => (
            current.schoolId ? current : { ...current, schoolId: schoolList[0].schoolId }
          ))
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        if (error instanceof ApiRequestError && error.status === 403) {
          setMessage('You are signed in, but your account has not been approved in the Users sheet.')
        } else {
          setMessage(error instanceof Error ? error.message : 'Unable to load app data.')
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false)
        }
      }
    }

    void loadAppData(firebaseUser)

    return () => {
      cancelled = true
    }
  }, [firebaseUser])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) =>
      `${a.eventDate} ${a.startTime}`.localeCompare(`${b.eventDate} ${b.startTime}`),
    )
  }, [events])

  async function handleAuthSubmit(event: FormEvent, mode: 'sign-in' | 'sign-up') {
    event.preventDefault()
    setMessage('')
    try {
      if (mode === 'sign-up') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      setPassword('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.')
    }
  }

  async function handleSignUp() {
    setMessage('')
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      setPassword('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign up failed.')
    }
  }

  async function handleClaim(eventId: string, slotType: SlotType) {
    if (!firebaseUser) {
      return
    }

    setMessage('')
    try {
      const updatedEvent = await claimSlot(firebaseUser, eventId, slotType)
      replaceEvent(updatedEvent)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to claim slot.')
    }
  }

  async function handleCancel(eventId: string, slotType: SlotType) {
    if (!firebaseUser) {
      return
    }

    setMessage('')
    try {
      const updatedEvent = await cancelClaim(firebaseUser, eventId, slotType)
      replaceEvent(updatedEvent)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to cancel claim.')
    }
  }

  async function handleCreateEvent(event: FormEvent) {
    event.preventDefault()
    if (!firebaseUser) {
      return
    }

    setMessage('')
    try {
      const createdEvent = await createEvent(firebaseUser, eventForm)
      setEvents((current) => [...current, createdEvent])
      setEventForm((current) => ({
        ...emptyEventForm,
        schoolId: current.schoolId,
      }))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create event.')
    }
  }

  function replaceEvent(updatedEvent: JoinedEvent) {
    setEvents((current) =>
      current.map((event) => (event.eventId === updatedEvent.eventId ? updatedEvent : event)),
    )
  }

  const canManageEvents = appUser?.role === 'admin' || appUser?.role === 'staff'

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">WNY Girl Scouts</p>
          <h1>Event claims</h1>
        </div>
        {firebaseUser && (
          <button type="button" onClick={() => void signOut(auth)}>
            Sign out
          </button>
        )}
      </header>

      {message && <div className="notice">{message}</div>}

      {!firebaseUser && !authLoading && (
        <section className="panel auth-panel">
          <h2>Sign in</h2>
          <form onSubmit={(event) => void handleAuthSubmit(event, 'sign-in')}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <div className="button-row">
              <button type="submit">Sign in</button>
              <button
                type="button"
                className="secondary"
                onClick={() => void handleSignUp()}
              >
                Sign up
              </button>
            </div>
          </form>
        </section>
      )}

      {firebaseUser && (
        <>
          <section className="panel account-panel">
            <h2>Current user</h2>
            <dl>
              <div>
                <dt>Firebase email</dt>
                <dd>{firebaseUser.email}</dd>
              </div>
              {appUser && (
                <>
                  <div>
                    <dt>Approved user</dt>
                    <dd>{appUser.fullName || appUser.email}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{appUser.role}</dd>
                  </div>
                  <div>
                    <dt>Active</dt>
                    <dd>{appUser.active ? 'TRUE' : 'FALSE'}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          {canManageEvents && (
            <CreateEventForm
              eventForm={eventForm}
              schools={schools}
              onChange={setEventForm}
              onSubmit={handleCreateEvent}
            />
          )}

          <section className="events-section">
            <div className="section-heading">
              <h2>Events</h2>
              {dataLoading && <span>Loading...</span>}
            </div>
            <div className="event-grid">
              {appUser &&
                sortedEvents.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    appUser={appUser}
                    onClaim={handleClaim}
                    onCancel={handleCancel}
                  />
                ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

interface CreateEventFormProps {
  eventForm: CreateEventPayload
  schools: School[]
  onChange: (value: CreateEventPayload) => void
  onSubmit: (event: FormEvent) => void
}

function CreateEventForm({ eventForm, schools, onChange, onSubmit }: CreateEventFormProps) {
  return (
    <section className="panel">
      <h2>Create event</h2>
      <form className="event-form" onSubmit={(event) => void onSubmit(event)}>
        <label>
          School
          {schools.length > 0 ? (
            <select
              value={eventForm.schoolId}
              onChange={(event) => onChange({ ...eventForm, schoolId: event.target.value })}
              required
            >
              {schools.map((school) => (
                <option key={school.schoolId} value={school.schoolId}>
                  {school.schoolName} ({school.schoolId})
                </option>
              ))}
            </select>
          ) : (
            <input
              value={eventForm.schoolId}
              onChange={(event) => onChange({ ...eventForm, schoolId: event.target.value })}
              placeholder="SCH-0001"
              required
            />
          )}
        </label>
        <label>
          Date
          <input
            type="date"
            value={eventForm.eventDate}
            onChange={(event) => onChange({ ...eventForm, eventDate: event.target.value })}
            required
          />
        </label>
        <label>
          Day
          <input
            value={eventForm.dayOfWeek}
            onChange={(event) => onChange({ ...eventForm, dayOfWeek: event.target.value })}
            required
          />
        </label>
        <label>
          Start time
          <input
            value={eventForm.startTime}
            onChange={(event) => onChange({ ...eventForm, startTime: event.target.value })}
            required
          />
        </label>
        <label>
          End time
          <input
            value={eventForm.endTime}
            onChange={(event) => onChange({ ...eventForm, endTime: event.target.value })}
            required
          />
        </label>
        <label>
          Event type
          <input
            value={eventForm.eventType}
            onChange={(event) => onChange({ ...eventForm, eventType: event.target.value })}
            required
          />
        </label>
        <label>
          Status
          <select
            value={eventForm.status}
            onChange={(event) => onChange({ ...eventForm, status: event.target.value })}
          >
            <option value="draft">draft</option>
            <option value="open">open</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
        <label>
          Time notes
          <input
            value={eventForm.timeNotes}
            onChange={(event) => onChange({ ...eventForm, timeNotes: event.target.value })}
          />
        </label>
        <label>
          Arrival notes
          <input
            value={eventForm.arrivalNotes}
            onChange={(event) => onChange({ ...eventForm, arrivalNotes: event.target.value })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={eventForm.needsStaff}
            onChange={(event) => onChange({ ...eventForm, needsStaff: event.target.checked })}
          />
          Needs staff
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={eventForm.needsVolunteer}
            onChange={(event) => onChange({ ...eventForm, needsVolunteer: event.target.checked })}
          />
          Needs volunteer
        </label>
        <button type="submit">Create draft event</button>
      </form>
    </section>
  )
}

interface EventCardProps {
  event: JoinedEvent
  appUser: AppUser
  onClaim: (eventId: string, slotType: SlotType) => void
  onCancel: (eventId: string, slotType: SlotType) => void
}

function EventCard({ event, appUser, onClaim, onCancel }: EventCardProps) {
  const canClaimStaff =
    event.availability.staffSlotAvailable && (appUser.role === 'admin' || appUser.role === 'staff')
  const canClaimVolunteer =
    event.availability.volunteerSlotAvailable &&
    (appUser.role === 'admin' || appUser.role === 'volunteer')
  const canCancelStaff =
    event.staffClaim && (appUser.role === 'admin' || event.staffClaim.userEmail === appUser.email)
  const canCancelVolunteer =
    event.volunteerClaim &&
    (appUser.role === 'admin' || event.volunteerClaim.userEmail === appUser.email)

  return (
    <article className="event-card">
      <div className="event-card-header">
        <div>
          <h3>{event.school?.schoolName ?? event.eventId}</h3>
          <p>{[event.school?.cityTown, event.school?.county].filter(Boolean).join(', ')}</p>
        </div>
        <span className={`status status-${event.status}`}>{event.status}</span>
      </div>
      <dl className="event-details">
        <div>
          <dt>Date</dt>
          <dd>
            {event.dayOfWeek} {event.eventDate}
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {event.startTime} - {event.endTime}
            {event.timeNotes ? ` (${event.timeNotes})` : ''}
          </dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{event.eventType}</dd>
        </div>
        <div>
          <dt>Needs</dt>
          <dd>
            Staff: {event.needsStaff ? 'yes' : 'no'} / Volunteer:{' '}
            {event.needsVolunteer ? 'yes' : 'no'}
          </dd>
        </div>
        <div>
          <dt>Staff claim</dt>
          <dd>{formatClaim(event.staffClaim)}</dd>
        </div>
        <div>
          <dt>Volunteer claim</dt>
          <dd>{formatClaim(event.volunteerClaim)}</dd>
        </div>
        <div>
          <dt>Coverage</dt>
          <dd>{event.availability.coverageStatus}</dd>
        </div>
        <div>
          <dt>Lead cards</dt>
          <dd>{event.leadCardsCount ?? ''}</dd>
        </div>
        <div>
          <dt>Follow-up</dt>
          <dd>{event.followupNotes}</dd>
        </div>
      </dl>
      {event.arrivalNotes && <p className="notes">Arrival: {event.arrivalNotes}</p>}
      <div className="button-row">
        {canClaimStaff && (
          <button type="button" onClick={() => void onClaim(event.eventId, 'staff')}>
            Claim staff slot
          </button>
        )}
        {canClaimVolunteer && (
          <button type="button" onClick={() => void onClaim(event.eventId, 'volunteer')}>
            Claim volunteer slot
          </button>
        )}
        {canCancelStaff && (
          <button
            type="button"
            className="secondary"
            onClick={() => void onCancel(event.eventId, 'staff')}
          >
            Cancel staff claim
          </button>
        )}
        {canCancelVolunteer && (
          <button
            type="button"
            className="secondary"
            onClick={() => void onCancel(event.eventId, 'volunteer')}
          >
            Cancel volunteer claim
          </button>
        )}
      </div>
    </article>
  )
}

function formatClaim(claim: JoinedEvent['staffClaim']) {
  if (!claim) {
    return 'Open'
  }

  return `${claim.userName || claim.userEmail} (${claim.userEmail})`
}

export default App
