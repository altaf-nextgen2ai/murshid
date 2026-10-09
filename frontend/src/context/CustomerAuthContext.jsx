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
  // This is the single source of truth for whether the auth modal is open.
  const [isModalOpen, setIsModalOpen] = useState(false)

  // ── Pending action ───────────────────────────────────────────────────────
  // Callback to run after a successful login (e.g. "add item to cart").
  const pendingActionRef = useRef(null)

  // ── GIS SDK state ────────────────────────────────────────────────────────
  // Tracks whether window.google.accounts.id.initialize() has been called.
  // We must call it exactly once per page load.
  const isGisInitializedRef = useRef(false)
  // Tracks whether the GIS <script> is already being loaded.
  const isGisLoadingRef = useRef(false)

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Initialize GIS exactly once. Safe to call multiple times — the ref guard
   * prevents duplicate initialize() calls which cause the console warning.
   * FedCM is deliberately disabled (use_fedcm_for_prompt: false) to avoid the
   * "FedCM get() rejects with NetworkError" console error on production.
   */
  const initGis = useCallback(() => {
    if (!window.google?.accounts?.id) return
    if (isGisInitializedRef.current) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // avoids FedCM NetworkError in production
      })
      isGisInitializedRef.current = true
    } catch (err) {
      console.error('[GIS] initialize() failed:', err)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Load the Google Identity Services script once, then call initGis().
   * If it is already present or loading, skip injection.
   */
  const ensureGisLoaded = useCallback(
    (onReady) => {
      if (window.google?.accounts?.id) {
        initGis()
        onReady?.()
        return
      }
      if (isGisLoadingRef.current) {
        // Script is already being fetched; attach another onload listener
        const existing = document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        )
        if (existing) {
          existing.addEventListener('load', () => {
            initGis()
            onReady?.()
          }, { once: true })
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

  // ── Credential callback (called by GIS after user picks an account) ──────
  const handleCredentialResponse = useCallback(async (response) => {
    if (response?.credential) {
      await googleLogin({ credential: response.credential })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── openAuthModal ────────────────────────────────────────────────────────
  /**
   * The single entry-point to show the auth modal. Called from:
   *   - CartContext (when user tries to add item while logged out)
   *   - Navbar sign-in button
   *   - GoogleOneTapPrompt (auto-trigger after 1s on first visit)
   *
   * Always opens the modal UI. Also ensures GIS is loaded and rendered
   * inside the modal for the official Google button.
   */
  const openAuthModal = useCallback((onSuccessAction) => {
    if (customerUser) return // already logged in — nothing to open

    // Store the callback to run after successful login
    if (typeof onSuccessAction === 'function') {
      pendingActionRef.current = onSuccessAction
    } else {
      pendingActionRef.current = null
    }

    // Ensure GIS SDK is loaded (modal will render the official button)
    ensureGisLoaded()

    // Open the modal — this triggers GoogleAuthModal to render
    setIsModalOpen(true)
  }, [customerUser, ensureGisLoaded])

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false)
    // Do NOT clear pendingAction here — user may close and re-open the modal
    // without losing the pending cart action
  }, [])

  // ── googleLogin ──────────────────────────────────────────────────────────
  /**
   * Sends the verified Google credential to our backend.
   * Only accepts { credential } — no plain email/name bypass.
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
      toast.success(`Welcome, ${fullUser.name || 'Customer'}! 👋`)

      // Run the deferred action (e.g. add-to-cart) after login
      if (pendingActionRef.current) {
        const action = pendingActionRef.current
        pendingActionRef.current = null
        // Small delay so state settles before the action runs
        setTimeout(action, 50)
      }

      return { success: true, user: fullUser }
    } catch (err) {
      const msg =
        err.response?.data?.error || 'Google Sign-In failed. Please try again.'
      toast.error(msg)
      return { success: false }
    }
  }, [])

  // ── logoutCustomer ───────────────────────────────────────────────────────
  const logoutCustomer = useCallback(() => {
    localStorage.removeItem('customerUser')
    setCustomerUser(null)
    // Also cancel any pending deferred action
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
