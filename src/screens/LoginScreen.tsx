import { useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import type { Screen } from '../types'

interface LoginScreenProps {
  onNavigate: (screen: Screen) => void
}

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [email, setEmail] = useState('')

  return (
    <section className="screen centered-form-screen">
      <AppLogo />
      <div className="form-copy">
        <h1>Welcome!</h1>
        <p>Please enter your email to continue.</p>
      </div>
      <label className="visually-hidden" htmlFor="email">
        Email address
      </label>
      <input
        id="email"
        className="text-field"
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <p className="signup-prompt">
        Don&apos;t have an account?
        <button type="button">Sign up</button>
      </p>
      <button className="primary-button next-button" type="button" onClick={() => onNavigate('search')}>
        Next
      </button>
    </section>
  )
}
