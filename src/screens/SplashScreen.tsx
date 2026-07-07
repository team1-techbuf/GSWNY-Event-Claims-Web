import { AppLogo } from '../components/AppLogo'
import { ArrowRightIcon } from '../components/Icons'
import type { Screen } from '../types'

interface SplashScreenProps {
  onNavigate: (screen: Screen) => void
}

export function SplashScreen({ onNavigate }: SplashScreenProps) {
  return (
    <section className="screen splash-screen">
      <AppLogo />
      <button className="primary-button splash-login" type="button" onClick={() => onNavigate('login')}>
        <span>Login</span>
        <ArrowRightIcon />
      </button>
      <div className="gswny-lockup" aria-label="Girl Scouts of Western New York">
        <strong>girl scouts</strong>
        <span>of western new york</span>
      </div>
    </section>
  )
}
