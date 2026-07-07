import { useCallback, useEffect, useState } from 'react'
import './App.css'
import {
  ApiRequestError,
  claimSlot,
  cancelClaim,
  completeEvent,
  createEvent,
  getEvents,
  getSchools,
  notifyVolunteers,
  updateEvent,
  type AppUser,
  type CreateEventPayload,
  type JoinedEvent,
  type School,
  type SlotType,
} from './api'
import { useAuth } from './auth/AuthContext'
import { BottomNav } from './components/BottomNav'
import { Toast } from './components/Toast'
import { EventFormScreen } from './screens/EventFormScreen'
import { EventsScreen } from './screens/EventsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { MeScreen } from './screens/MeScreen'
import { PendingApprovalScreen } from './screens/PendingApprovalScreen'
import { SplashScreen } from './screens/SplashScreen'
import { StaffScreen } from './screens/StaffScreen'
import { VerifyEmailScreen } from './screens/VerifyEmailScreen'
import type { Overlay, Tab } from './types'
import type { User } from 'firebase/auth'

function App() {
  const { status, firebaseUser, appUser } = useAuth()

  if (status === 'loading') {
    return <Shell><SplashScreen /></Shell>
  }
  if (status === 'signedOut') {
    return <Shell><LoginScreen /></Shell>
  }
  if (status === 'unverified') {
    return <Shell><VerifyEmailScreen /></Shell>
  }
  if (status === 'pending' || !appUser || !firebaseUser) {
    return <Shell><PendingApprovalScreen /></Shell>
  }

  return (
    <Shell>
      <MainApp firebaseUser={firebaseUser} appUser={appUser} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-stage">
      <div className="phone-shell">{children}</div>
    </main>
  )
}

interface MainAppProps {
  firebaseUser: User
  appUser: AppUser
}

function MainApp({ firebaseUser, appUser }: MainAppProps) {
  const { signOut } = useAuth()
  const canManage = appUser.role === 'admin' || appUser.role === 'staff'

  const [tab, setTab] = useState<Tab>('events')
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' })
  const [events, setEvents] = useState<JoinedEvent[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null)

  const notify = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ text, kind })
  }, [])

  const load = useCallback(async () => {
    try {
      const [nextEvents, nextSchools] = await Promise.all([
        getEvents(firebaseUser),
        getSchools(firebaseUser),
      ])
      setEvents(nextEvents)
      setSchools(nextSchools)
    } catch (err) {
      notify(errorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [firebaseUser, notify])

  useEffect(() => {
    // Initial + dependency-driven data load; state updates happen async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Wrap a mutating action: run it, refresh from the sheet (source of truth),
  // and surface success/error feedback.
  const run = useCallback(
    async (action: () => Promise<unknown>, successText: string) => {
      setBusy(true)
      try {
        await action()
        await load()
        notify(successText, 'ok')
        return true
      } catch (err) {
        // On a 409 the displayed availability was stale; refresh to correct it.
        if (err instanceof ApiRequestError && err.status === 409) {
          await load()
        }
        notify(errorMessage(err), 'error')
        return false
      } finally {
        setBusy(false)
      }
    },
    [load, notify],
  )

  const handleClaim = useCallback(
    (eventId: string, slot: SlotType) => {
      void run(() => claimSlot(firebaseUser, eventId, slot), `Claimed the ${slot} slot. Confirmation emailed.`)
    },
    [firebaseUser, run],
  )

  const handleDrop = useCallback(
    (eventId: string, slot: SlotType) => {
      void run(() => cancelClaim(firebaseUser, eventId, slot), `Dropped the ${slot} slot. Confirmation emailed.`)
    },
    [firebaseUser, run],
  )

  const handleComplete = useCallback(
    (eventId: string, leadCardsCount: number | null, followupNotes: string) => {
      void run(
        () => completeEvent(firebaseUser, eventId, { leadCardsCount, followupNotes }),
        'Event marked completed.',
      )
    },
    [firebaseUser, run],
  )

  const handleNotify = useCallback(
    (eventId: string) => {
      void run(async () => {
        const result = await notifyVolunteers(firebaseUser, eventId, '')
        notify(`Notified ${result.notified} volunteer${result.notified === 1 ? '' : 's'}.`, 'ok')
      }, 'Volunteers notified.')
    },
    [firebaseUser, run, notify],
  )

  const handlePublish = useCallback(
    (eventId: string) => {
      void run(() => updateEvent(firebaseUser, eventId, { status: 'open' }), 'Event published.')
    },
    [firebaseUser, run],
  )

  const handleSubmitEvent = useCallback(
    async (payload: CreateEventPayload) => {
      const editingId = overlay.kind === 'event-form' ? overlay.eventId : null
      const ok = await run(
        () =>
          editingId
            ? updateEvent(firebaseUser, editingId, payload)
            : createEvent(firebaseUser, payload),
        editingId ? 'Event updated.' : 'Event created.',
      )
      if (ok) {
        setOverlay({ kind: 'none' })
      }
    },
    [firebaseUser, overlay, run],
  )

  if (overlay.kind === 'event-form') {
    const initial = overlay.eventId
      ? events.find((event) => event.eventId === overlay.eventId) ?? null
      : null
    return (
      <>
        <EventFormScreen
          schools={schools}
          initial={initial}
          initialDate={overlay.prefillDate}
          busy={busy}
          onSubmit={handleSubmitEvent}
          onCancel={() => setOverlay({ kind: 'none' })}
        />
        {toast && <Toast text={toast.text} kind={toast.kind} onDone={() => setToast(null)} />}
      </>
    )
  }

  return (
    <>
      {loading ? (
        <SplashScreen />
      ) : tab === 'events' ? (
        <EventsScreen
          events={events}
          role={appUser.role}
          email={appUser.email}
          busy={busy}
          canManage={canManage}
          onClaim={handleClaim}
          onDrop={handleDrop}
          onAddEvent={() => setOverlay({ kind: 'event-form', eventId: null })}
          onAddEventOnDate={(dateISO) =>
            setOverlay({ kind: 'event-form', eventId: null, prefillDate: dateISO })
          }
          onEditEvent={(eventId) => setOverlay({ kind: 'event-form', eventId })}
        />
      ) : tab === 'staff' && canManage ? (
        <StaffScreen
          events={events}
          role={appUser.role}
          email={appUser.email}
          busy={busy}
          onClaim={handleClaim}
          onDrop={handleDrop}
          onAddEvent={() => setOverlay({ kind: 'event-form', eventId: null })}
          onEditEvent={(eventId) => setOverlay({ kind: 'event-form', eventId })}
          onNotify={handleNotify}
          onPublish={handlePublish}
        />
      ) : (
        <MeScreen
          appUser={appUser}
          events={events}
          busy={busy}
          onDrop={handleDrop}
          onComplete={handleComplete}
          onSignOut={() => void signOut()}
        />
      )}

      <BottomNav active={tab} canManage={canManage} onNavigate={setTab} />
      {toast && <Toast text={toast.text} kind={toast.kind} onDone={() => setToast(null)} />}
    </>
  )
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) {
      return 'Your session expired. Please sign in again.'
    }
    if (err.status === 403) {
      return 'You are not allowed to perform that action.'
    }
    return err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong.'
}

export default App
