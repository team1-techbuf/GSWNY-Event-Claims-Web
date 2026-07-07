import { useEffect, useState } from 'react'
import './App.css'
import { initialEvents, profile } from './data/mockData'
import { AddEventScreen } from './screens/AddEventScreen'
import { CalendarScreen } from './screens/CalendarScreen'
import { EventsScreen } from './screens/EventsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SearchScreen } from './screens/SearchScreen'
import { SplashScreen } from './screens/SplashScreen'
import type { EventRecord, Screen } from './types'

const screens: Screen[] = ['splash', 'login', 'search', 'events', 'calendar', 'add-event', 'profile']

function getScreenFromHash(): Screen {
  const hash = window.location.hash.replace('#', '')
  return screens.includes(hash as Screen) ? (hash as Screen) : 'splash'
}

function App() {
  const [screen, setScreen] = useState<Screen>(() => getScreenFromHash())
  const [events, setEvents] = useState<EventRecord[]>(initialEvents)

  useEffect(() => {
    function handleHashChange() {
      setScreen(getScreenFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function navigate(nextScreen: Screen) {
    if (window.location.hash !== `#${nextScreen}`) {
      window.location.hash = nextScreen
      return
    }

    setScreen(nextScreen)
  }

  function addEvent(event: EventRecord) {
    setEvents((current) => [event, ...current])
  }

  return (
    <main className="app-stage">
      <div className="phone-shell">
        {screen === 'splash' && <SplashScreen onNavigate={navigate} />}
        {screen === 'login' && <LoginScreen onNavigate={navigate} />}
        {screen === 'search' && <SearchScreen onNavigate={navigate} />}
        {screen === 'events' && <EventsScreen events={events} onNavigate={navigate} />}
        {screen === 'calendar' && <CalendarScreen events={events} onNavigate={navigate} />}
        {screen === 'add-event' && <AddEventScreen onAddEvent={addEvent} onNavigate={navigate} />}
        {screen === 'profile' && (
          <ProfileScreen event={events[0] ?? initialEvents[0]} profile={profile} onNavigate={navigate} />
        )}
      </div>
    </main>
  )
}

export default App
