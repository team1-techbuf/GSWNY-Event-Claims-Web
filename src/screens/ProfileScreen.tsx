import { AppLogo } from '../components/AppLogo'
import { BottomNav } from '../components/BottomNav'
import { EventCard } from '../components/EventCard'
import { PersonIcon } from '../components/Icons'
import type { EventRecord, Profile, Screen } from '../types'

interface ProfileScreenProps {
  event: EventRecord
  profile: Profile
  onNavigate: (screen: Screen) => void
}

export function ProfileScreen({ event, profile, onNavigate }: ProfileScreenProps) {
  return (
    <section className="screen with-bottom-nav profile-screen">
      <header className="top-bar profile-top">
        <AppLogo compact />
        <button type="button" onClick={() => onNavigate('login')}>
          Log Out
        </button>
      </header>
      <div className="profile-avatar" aria-hidden="true">
        <PersonIcon />
      </div>
      <h1>{profile.name}</h1>
      <p className="profile-role">{profile.role}</p>
      <dl className="profile-details">
        <div>
          <dt>Email:</dt>
          <dd>{profile.email}</dd>
        </div>
        <div>
          <dt>Service Unit:</dt>
          <dd>{profile.serviceUnit}</dd>
        </div>
        <div>
          <dt>Registered Events:</dt>
          <dd>
            <EventCard event={event} compact />
          </dd>
        </div>
      </dl>
      <BottomNav active="profile" onNavigate={onNavigate} />
    </section>
  )
}
