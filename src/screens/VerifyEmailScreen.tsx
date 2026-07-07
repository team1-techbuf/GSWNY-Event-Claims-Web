import { useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { useAuth } from '../auth/AuthContext'

export function VerifyEmailScreen() {
  const { firebaseUser, resendVerification, refresh, signOut } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleResend() {
    setBusy(true)
    setMessage(null)
    try {
      await resendVerification()
      setMessage('Verification email sent. Check your inbox.')
    } catch {
      setMessage('Could not send email. Please wait a moment and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRefresh() {
    setBusy(true)
    setMessage(null)
    try {
      await refresh()
      setMessage('If you just verified, your account will load automatically.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="screen centered-form-screen gate-screen">
      <AppLogo />
      <div className="form-copy">
        <h1>Verify Your Email</h1>
        <p>
          We sent a verification link to <strong>{firebaseUser?.email}</strong>. Please verify,
          then tap “I&apos;ve verified”.
        </p>
      </div>
      {message && <p className="form-note">{message}</p>}
      <div className="gate-actions">
        <button className="primary-button full-button" type="button" disabled={busy} onClick={handleRefresh}>
          I&apos;ve verified
        </button>
        <button className="secondary-button full-button" type="button" disabled={busy} onClick={handleResend}>
          Resend email
        </button>
      </div>
      <button className="text-link" type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </section>
  )
}
