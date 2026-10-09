import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { authService } from '../services/api'
import toast from 'react-hot-toast'

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '173907682716-q2gape30qtu66gs1k8gv21bemrmvm9rb.apps.googleusercontent.com'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  // ── Persisted customer session ───────────────────────────────────────────
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('customerUser')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // ── Modal visibility ─────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ── Pending action ───────────────────────────────────────────────────────
  const pendingActionRef = useRef(null)

  // ── GIS SDK state ────────────────────────────────────────────────────────
  const isGisInitializedRef = useRef(false)
  const isGisLoadingRef = useRef(false)
  const credentialCallbackRef = useRef(null)

  // ── googleLogin ──────────────────────────────────────────────────────────
  /**
   * Sends the verified Google credential to our backend.
   */
  const googleLogin = useCallback(async (data) => {
    try {
      const res = await authService.googleLogin(data)
      const userData = res.data.user
      const access = res.data.access
      const fullUser = { ...userData, token: access }

      localStorage.setItem('customerUser', JSON.stringify(fullUser))
      setCustomerUser(fullUser)
      setIsModalOpen(false)
      toast.success(`Welcome back, ${fullUser.name || 'Customer'}! 👋`)

      if (pendingActionRef.current) {
        const action = pendingActionRef.current
        pendingActionRef.current = null
        setTimeout(action, 50)
      }

      return { success: true, user: fullUser }
    } catch (err) {
      console.error('[Google Login Error]:', err)
      const msg =
        err.response?.data?.error || 'Google Sign-In failed. Please try again.'
      toast.error(msg)
      return { success: false }
    }
  }, [])

  // ── Credential callback ──────────────────────────────────────────────────
  const handleCredentialResponse = useCallback(
    async (response) => {
      if (response?.credential) {
        await googleLogin({ credential: response.credential })
      }
    },
    [googleLogin]
  )

  // Wire the ref
  credentialCallbackRef.current = handleCredentialResponse

  /**
   * Initialize GIS exactly once.
   */
  const initGis = useCallback(() => {
    if (!window.google?.accounts?.id) return
    if (isGisInitializedRef.current) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (credentialCallbackRef.current) {
            credentialCallbackRef.current(response)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      })
      isGisInitializedRef.current = true
    } catch (err) {
      console.error('[GIS] initialize() failed:', err)
    }
  }, [])

  /**
   * Load GIS script once.
   */
  const ensureGisLoaded = useCallback(
    (onReady) => {
      if (window.google?.accounts?.id) {
        initGis()
        onReady?.()
        return
      }
      if (isGisLoadingRef.current) {
        const existing = document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        )
        if (existing) {
          existing.addEventListener(
            'load',
            () => {
              initGis()
              onReady?.()
            },
            { once: true }
          )
        }
        return
      }
      isGisLoadingRef.current = true
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        initGis()
        onReady?.()
      }
      script.onerror = () => {
        isGisLoadingRef.current = false
        console.error('[GIS] Failed to load Google Identity Services script.')
      }
      document.head.appendChild(script)
    },
    [initGis]
  )

  const openAuthModal = useCallback(
    (onSuccessAction) => {
      if (customerUser) return

      if (typeof onSuccessAction === 'function') {
        pendingActionRef.current = onSuccessAction
      } else {
        pendingActionRef.current = null
      }

      ensureGisLoaded()
      setIsModalOpen(true)
    },
    [customerUser, ensureGisLoaded]
  )

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const logoutCustomer = useCallback(() => {
    localStorage.removeItem('customerUser')
    setCustomerUser(null)
    pendingActionRef.current = null
    toast.success('Signed out successfully.')
  }, [])

  return (
    <CustomerAuthContext.Provider
      value={{
        customerUser,
        isLoggedIn: !!customerUser,
        isModalOpen,
        openAuthModal,
        closeAuthModal,
        googleLogin,
        logoutCustomer,
        ensureGisLoaded,
        initGis,
        GOOGLE_CLIENT_ID,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  return ctx
}
