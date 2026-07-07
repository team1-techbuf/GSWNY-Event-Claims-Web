import type { Tab } from '../types'
import { CalendarLineIcon, PersonIcon, ShieldIcon } from './Icons'

interface BottomNavProps {
  active: Tab
  canManage: boolean
  onNavigate: (tab: Tab) => void
}

export function BottomNav({ active, canManage, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {canManage && (
        <button
          className={active === 'staff' ? 'nav-item active' : 'nav-item'}
          type="button"
          onClick={() => onNavigate('staff')}
        >
          <ShieldIcon />
          <span>Staff</span>
        </button>
      )}
      <button
        className={active === 'events' ? 'nav-item active' : 'nav-item'}
        type="button"
        onClick={() => onNavigate('events')}
      >
        <CalendarLineIcon />
        <span>Events</span>
      </button>
      <button
        className={active === 'me' ? 'nav-item active' : 'nav-item'}
        type="button"
        onClick={() => onNavigate('me')}
      >
        <PersonIcon />
        <span>Me</span>
      </button>
    </nav>
  )
}
