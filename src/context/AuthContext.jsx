import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, reload } from 'firebase/auth'
import { auth } from '../../firebase'
import { isSecEmail } from '../lib/validators'
import { resendVerification, signIn, signInWithGoogle, signOutUser, signUp } from '../lib/firebaseAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setStatus('anonymous')
        return
      }
      setUser(firebaseUser)
      setStatus(firebaseUser.emailVerified && isSecEmail(firebaseUser.email) ? 'verified' : 'unverified')
    })
    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email, password) => {
    const u = await signIn(email, password)
    if (!u.emailVerified) setStatus('unverified')
    return u
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const u = await signInWithGoogle()
    return u
  }, [])

  const register = useCallback(async (email, password, displayName) => {
    const u = await signUp(email, password, displayName)
    setStatus('unverified')
    return u
  }, [])

  const logout = useCallback(async () => {
    await signOutUser()
  }, [])

  const resend = useCallback(async () => {
    if (auth.currentUser) await resendVerification(auth.currentUser)
  }, [])

  const refresh = useCallback(async () => {
    if (!auth.currentUser) return
    await reload(auth.currentUser)
    const u = auth.currentUser
    setStatus(u.emailVerified && isSecEmail(u.email) ? 'verified' : 'unverified')
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isVerified: status === 'verified',
      isSec: Boolean(user) && isSecEmail(user.email),
      email: user?.email ?? null,
      displayName: user?.displayName ?? null,
      uid: user?.uid ?? null,
      login,
      loginWithGoogle,
      register,
      logout,
      resend,
      refresh,
    }),
    [user, status, login, loginWithGoogle, register, logout, resend, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
