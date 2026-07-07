import { useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { useAuth } from '../auth/AuthContext'

export function PendingApprovalScreen() {
  const { firebaseUser, error, refresh, signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  async function handleRefresh() {
    setBusy(true)
    try {
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="screen centered-form-screen gate-screen">
      <AppLogo />
      <div className="form-copy">
        <h1>Almost There</h1>
        <p>
          Your account (<strong>{firebaseUser?.email}</strong>) is awaiting approval from a Girl
          Scouts administrator. You&apos;ll be able to view and claim events once approved.
        </p>
      </div>
      {error && <p className="form-note">{error}</p>}
      <div className="gate-actions">
        <button className="primary-button full-button" type="button" disabled={busy} onClick={handleRefresh}>
          Check again
        </button>
      </div>
      <button className="text-link" type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </section>
  )
}
