import { CalendarIcon } from './Icons'

interface AppLogoProps {
  compact?: boolean
}

export function AppLogo({ compact = false }: AppLogoProps) {
  return (
    <div className={compact ? 'app-logo app-logo-compact' : 'app-logo'}>
      <span>GoScouts</span>
      <CalendarIcon />
    </div>
  )
}
