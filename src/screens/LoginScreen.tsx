import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { AppLogo } from '../components/AppLogo'
import { useAuth } from '../auth/AuthContext'

type Mode = 'signin' | 'signup'

function friendlyAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.'
      case 'auth/email-already-in-use':
        return 'An account already exists for this email. Try signing in.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.'
      default:
        return error.message.replace('Firebase: ', '')
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.')
          return
        }
        await signUp(email, password, fullName)
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="screen centered-form-screen auth-screen">
      <AppLogo />
      <div className="form-copy">
        <h1>{mode === 'signin' ? 'Welcome!' : 'Create Account'}</h1>
        <p>
          {mode === 'signin'
            ? 'Sign in with your email and password to continue.'
            : 'Sign up to claim and manage Girl Scouts events.'}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <input
            className="text-field"
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        )}
        <input
          className="text-field"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="text-field"
          type="password"
          placeholder="Password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button full-button" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <p className="signup-prompt">
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
        <button
          type="button"
          onClick={() => {
            setError(null)
            setMode(mode === 'signin' ? 'signup' : 'signin')
          }}
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </section>
  )
}
