import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'
import { ApiRequestError, getMe, registerSignup, type AppUser } from '../api'

type AuthStatus =
  | 'loading' // resolving firebase auth state
  | 'signedOut' // no firebase user
  | 'unverified' // firebase user but email not verified
  | 'pending' // verified firebase user, no active app user row yet
  | 'ready' // verified firebase user with an active app user

interface AuthContextValue {
  status: AuthStatus
  firebaseUser: User | null
  appUser: AppUser | null
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  resendVerification: () => Promise<void>
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  // Load the approved app user for a verified firebase user. New web signups
  // are auto-activated by the backend once their email is verified.
  const loadAppUser = useCallback(async (user: User) => {
    try {
      const me = await getMe(user)
      setAppUser(me)
      setStatus(me.active ? 'ready' : 'pending')
    } catch (err) {
      setAppUser(null)
      if (err instanceof ApiRequestError && err.status === 403) {
        setStatus('pending')
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load your account.')
        setStatus('pending')
      }
    }
  }, [])

  const applyUser = useCallback(
    async (user: User | null) => {
      setError(null)
      if (!user) {
        setFirebaseUser(null)
        setAppUser(null)
        setStatus('signedOut')
        return
      }

      setFirebaseUser(user)
      if (!user.emailVerified) {
        setAppUser(null)
        setStatus('unverified')
        return
      }

      await loadAppUser(user)
    },
    [loadAppUser],
  )

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      void applyUser(user)
    })
  }, [applyUser])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    await credential.user.reload()
    await applyUser(auth.currentUser ?? credential.user)
  }, [applyUser])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      setError(null)
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      // Create the pending Users row and send a verification email.
      try {
        await registerSignup(credential.user, fullName.trim())
      } catch {
        // Row creation is best-effort here; auto-activation retries on next call.
      }
      await sendEmailVerification(credential.user)
      await applyUser(credential.user)
    },
    [applyUser],
  )

  const resendVerification = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload()
      await applyUser(auth.currentUser)
    }
  }, [applyUser])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
    setStatus('signedOut')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      firebaseUser,
      appUser,
      error,
      signIn,
      signUp,
      resendVerification,
      refresh,
      signOut,
    }),
    [status, firebaseUser, appUser, error, signIn, signUp, resendVerification, refresh, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
