import { useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { BottomNav } from '../components/BottomNav'
import type { Screen } from '../types'

interface SearchScreenProps {
  onNavigate: (screen: Screen) => void
}

export function SearchScreen({ onNavigate }: SearchScreenProps) {
  const [query, setQuery] = useState('')

  return (
    <section className="screen with-bottom-nav search-screen">
      <AppLogo />
      <div className="form-copy search-copy">
        <h1>Search For Events Near You</h1>
        <p>Enter a zip code, your service unit or name of a school to search for events.</p>
      </div>
      <label className="visually-hidden" htmlFor="event-search">
        Zip code, service unit, or school
      </label>
      <input
        id="event-search"
        className="text-field"
        placeholder="Zip Code, Service Unit, or School"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="search-actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate('events')}>
          Skip
        </button>
        <button className="primary-button" type="button" onClick={() => onNavigate('events')}>
          Next
        </button>
      </div>
      <BottomNav active="events" onNavigate={onNavigate} />
    </section>
  )
}
