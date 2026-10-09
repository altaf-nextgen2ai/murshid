/**
 * GoogleAuthModal
 *
 * Rendered once inside CustomerLayout. Open/close state lives entirely in
 * CustomerAuthContext (isModalOpen / closeAuthModal).
 *
 * GIS initialize() is called exactly ONCE — in CustomerAuthContext.initGis().
 * This component only calls renderButton() which is safe to call on every open.
 * The callback is updated via a stable ref so we never need to re-initialize.
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
    ensureGisLoaded,
  } = useCustomerAuth()

  const googleBtnContainerRef = useRef(null)

  // Keep a stable ref to the latest googleLogin so the GIS callback
  // always calls the current version without needing a re-initialize.
  const googleLoginRef = useRef(googleLogin)
  useEffect(() => { googleLoginRef.current = googleLogin }, [googleLogin])

  // ── Render the official Google button whenever the modal opens ────────────
  useEffect(() => {
    if (!isModalOpen || customerUser) return

    const renderButton = () => {
      if (!window.google?.accounts?.id) return
      if (!googleBtnContainerRef.current) return

      googleBtnContainerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      })
    }

    // Ensure GIS is loaded and initialized (no-op if already done),
    // then render the button. ensureGisLoaded calls initGis() internally —
    // initGis() is guarded by isGisInitializedRef so it never double-fires.
    ensureGisLoaded(renderButton)

    // If GIS is already loaded, renderButton was called synchronously above.
    // If it was still loading, it'll be called via the onload callback.
    // Poll as a safety net in case the onload already fired before we attached.
    if (!window.google?.accounts?.id) {
      let attempts = 0
      const poll = setInterval(() => {
        attempts++
        if (window.google?.accounts?.id) {
          clearInterval(poll)
          renderButton()
        } else if (attempts > 40) {
          clearInterval(poll) // give up after 4 s
        }
      }, 100)
      return () => clearInterval(poll)
    }
  }, [isModalOpen, customerUser, ensureGisLoaded])

  // ── Set the GIS callback via a stable ref trick ───────────────────────────
  // We need GIS to call our googleLogin, but we can't re-initialize to update
  // the callback (that would cause the "called multiple times" warning).
  // Solution: initialize once with a wrapper that reads from a ref.
  // This useEffect runs once on mount to patch the callback if GIS is already
  // initialized with the old callback reference.
  useEffect(() => {
    // Nothing to do here — the callback indirection is handled in
    // CustomerAuthContext.initGis() which captures handleCredentialResponse,
    // which in turn calls googleLogin from the context closure.
    // googleLogin is stable (useCallback with no changing deps), so this is safe.
  }, [])

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closeAuthModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isModalOpen, closeAuthModal])

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : ''
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

        {/* ── Already signed in ──────────────────────────────────────── */}
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
          /* ── Sign-in view ───────────────────────────────────────────── */
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

            {/* GIS renders its iframe button inside this div */}
            <div className={styles.googleBtnWrap} ref={googleBtnContainerRef}>
              <div className={styles.googleBtnPlaceholder}>
                <FcGoogle size={18} />
                <span>Loading Google Sign-In…</span>
              </div>
            </div>

            <p className={styles.privacyNote}>
              By continuing you agree to our terms. We only read your name,
              email, and profile picture from Google.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
