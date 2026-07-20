import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'

import {
  firebaseConfigurationError,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '../../services/firebase.js'
import { AuthContext } from './AuthContext.js'
import { createSafeAuthError, toMinimalAuthUser } from './authUtils.js'

const DEFAULT_CONFIGURATION_ERROR = Object.freeze({
  code: 'firebase/configuration-unavailable',
  message: 'Firebase 인증 설정을 확인해 주세요.',
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthPending, setIsAuthPending] = useState(false)
  const [authError, setAuthError] = useState(null)
  const pendingRef = useRef(false)
  const auth = getFirebaseAuth()
  const isAuthAvailable = isFirebaseConfigured && auth !== null

  useEffect(() => {
    if (!isAuthAvailable) {
      setAuthError(firebaseConfigurationError ?? DEFAULT_CONFIGURATION_ERROR)
      setIsAuthLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(toMinimalAuthUser(firebaseUser))
        setAuthError(null)
        setIsAuthLoading(false)
      },
      (error) => {
        setUser(null)
        setAuthError(createSafeAuthError(error, 'state'))
        setIsAuthLoading(false)
      },
    )

    return unsubscribe
  }, [auth, isAuthAvailable])

  const loginWithGoogle = useCallback(async () => {
    if (!isAuthAvailable || pendingRef.current) {
      return false
    }

    pendingRef.current = true
    setAuthError(null)
    setIsAuthPending(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      return true
    } catch (error) {
      setAuthError(createSafeAuthError(error, 'login'))
      return false
    } finally {
      pendingRef.current = false
      setIsAuthPending(false)
    }
  }, [auth, isAuthAvailable])

  const logout = useCallback(async () => {
    if (!isAuthAvailable || pendingRef.current) {
      return false
    }

    pendingRef.current = true
    setAuthError(null)
    setIsAuthPending(true)

    try {
      await signOut(auth)
      return true
    } catch (error) {
      setAuthError(createSafeAuthError(error, 'logout'))
      return false
    } finally {
      pendingRef.current = false
      setIsAuthPending(false)
    }
  }, [auth, isAuthAvailable])

  const value = useMemo(
    () => ({
      user,
      isAuthLoading,
      isAuthPending,
      authError,
      isAuthAvailable,
      loginWithGoogle,
      logout,
    }),
    [
      user,
      isAuthLoading,
      isAuthPending,
      authError,
      isAuthAvailable,
      loginWithGoogle,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
