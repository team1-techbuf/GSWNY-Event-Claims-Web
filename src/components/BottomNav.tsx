import type { Screen } from '../types'
import { CalendarLineIcon, PersonIcon, ShieldIcon } from './Icons'

interface BottomNavProps {
  active: 'staff' | 'events' | 'profile'
  onNavigate: (screen: Screen) => void
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        className={active === 'staff' ? 'nav-item active' : 'nav-item'}
        type="button"
        onClick={() => onNavigate('events')}
      >
        <ShieldIcon />
        <span>Staff</span>
      </button>
      <button
        className={active === 'events' ? 'nav-item active' : 'nav-item'}
        type="button"
        onClick={() => onNavigate('events')}
      >
        <CalendarLineIcon />
        <span>Events</span>
      </button>
      <button
        className={active === 'profile' ? 'nav-item active' : 'nav-item'}
        type="button"
        onClick={() => onNavigate('profile')}
      >
        <PersonIcon />
        <span>Me</span>
      </button>
    </nav>
  )
}
