import { useState } from 'react'
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

function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [events, setEvents] = useState<EventRecord[]>(initialEvents)

  function addEvent(event: EventRecord) {
    setEvents((current) => [event, ...current])
  }

  return (
    <main className="app-stage">
      <div className="phone-shell">
        {screen === 'splash' && <SplashScreen onNavigate={setScreen} />}
        {screen === 'login' && <LoginScreen onNavigate={setScreen} />}
        {screen === 'search' && <SearchScreen onNavigate={setScreen} />}
        {screen === 'events' && <EventsScreen events={events} onNavigate={setScreen} />}
        {screen === 'calendar' && <CalendarScreen events={events} onNavigate={setScreen} />}
        {screen === 'add-event' && <AddEventScreen onAddEvent={addEvent} onNavigate={setScreen} />}
        {screen === 'profile' && (
          <ProfileScreen event={events[0] ?? initialEvents[0]} profile={profile} onNavigate={setScreen} />
        )}
      </div>
    </main>
  )
}

export default App
