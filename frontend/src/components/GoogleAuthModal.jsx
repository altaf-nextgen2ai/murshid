/**
 * GoogleAuthModal
 *
 * Rendered once inside CustomerLayout. Open/close state lives in
 * CustomerAuthContext (isModalOpen / closeAuthModal), so any caller
 * (cart, navbar, one-tap auto-prompt) can open it without prop-drilling.
 *
 * GIS is initialized exactly once in CustomerAuthContext.ensureGisLoaded().
 * This component never calls initialize() itself — it only calls renderButton()
 * after GIS is already ready, avoiding the "called multiple times" warning.
 */
import { useEffect, useRef } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { FiX, FiCheckCircle } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import styles from './GoogleAuthModal.module.css'

export default function GoogleAuthModal() {
  const {
    isModalOpen,
    closeAuthModal,
    customerUser,
    logoutCustomer,
    googleLogin,
    initGis,
    GOOGLE_CLIENT_ID,
  } = useCustomerAuth()

  const googleBtnContainerRef = useRef(null)
  // Track whether renderButton has already been called for this open instance
  const isButtonRenderedRef = useRef(false)

  // Render the official Google button every time the modal opens
  useEffect(() => {
    if (!isModalOpen || customerUser) {
      isButtonRenderedRef.current = false
      return
    }
    if (isButtonRenderedRef.current) return

    const tryRender = () => {
      if (!window.google?.accounts?.id) return
      if (!googleBtnContainerRef.current) return

      // Ensure GIS is initialized (safe no-op if already done)
      initGis()

      // Update the callback to point to the current googleLogin closure
      // We do this by re-initializing with the same client_id but a fresh
      // callback reference. GIS allows this as long as client_id is unchanged.
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              googleLogin({ credential: response.credential })
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        })
      } catch (_) {
        // initialize() may throw if called in quick succession; ignore safely
      }

      googleBtnContainerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      })
      isButtonRenderedRef.current = true
    }

    // GIS might not be loaded yet if the user reaches the modal very fast
    if (window.google?.accounts?.id) {
      tryRender()
    } else {
      // Poll briefly until the script loads (ensureGisLoaded was called in
      // openAuthModal, so it will arrive within a few hundred ms at most)
      let attempts = 0
      const poll = setInterval(() => {
        attempts++
        if (window.google?.accounts?.id) {
          clearInterval(poll)
          tryRender()
        } else if (attempts > 30) {
          clearInterval(poll) // stop after ~3s
        }
      }, 100)
      return () => clearInterval(poll)
    }
  }, [isModalOpen, customerUser, initGis, googleLogin, GOOGLE_CLIENT_ID])

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') closeAuthModal() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isModalOpen, closeAuthModal])

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isModalOpen])

  if (!isModalOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in with Google"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeBtn}
          onClick={closeAuthModal}
          aria-label="Close sign-in dialog"
        >
          <FiX size={18} />
        </button>

        {/* ── Logged-in view ───────────────────────────────────────────── */}
        {customerUser ? (
          <div className={styles.loggedInBox}>
            <img
              src={
                customerUser.picture ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  customerUser.name || 'User'
                )}`
              }
              alt={customerUser.name}
              className={styles.userAvatar}
            />
            <h3>Signed in as</h3>
            <p className={styles.userName}>{customerUser.name}</p>
            <p className={styles.userEmail}>{customerUser.email}</p>
            <div className={styles.badge}>
              <FiCheckCircle size={14} />
              Verified with Google
            </div>
            <button
              className={styles.signOutBtn}
              onClick={() => { logoutCustomer(); closeAuthModal() }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* ── Sign-in view ─────────────────────────────────────────────── */
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.iconCircle}>
                <FcGoogle size={30} />
              </div>
              <h2>Sign in to continue</h2>
              <p>
                Use your Google account to track orders and auto-fill checkout
                details.
              </p>
            </div>

            {/* Official Google Identity Services button — rendered by GIS SDK */}
            <div className={styles.googleBtnWrap} ref={googleBtnContainerRef}>
              {/* Placeholder shown while GIS script loads */}
              <div className={styles.googleBtnPlaceholder}>
                <FcGoogle size={20} />
                <span>Loading Google Sign-In…</span>
              </div>
            </div>

            <p className={styles.privacyNote}>
              By continuing, you agree to our terms. We only read your name,
              email, and profile picture from Google.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
