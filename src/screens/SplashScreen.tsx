import { AppLogo } from '../components/AppLogo'

export function SplashScreen() {
  return (
    <section className="screen splash-screen">
      <AppLogo />
      <p className="splash-loading">Loading…</p>
      <div className="gswny-lockup" aria-label="Girl Scouts of Western New York">
        <strong>girl scouts</strong>
        <span>of western new york</span>
      </div>
    </section>
  )
}
