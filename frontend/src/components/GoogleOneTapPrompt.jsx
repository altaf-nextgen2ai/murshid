/**
 * GoogleOneTapPrompt
 *
 * Silently fires openAuthModal() once per browser session, 1.5 s after the
 * first page load, if the user is not already signed in. Uses sessionStorage
 * so it only auto-prompts once — if the user dismisses, it won't re-trigger
 * on the next page navigation.
 *
 * openAuthModal() (from CustomerAuthContext) opens the GoogleAuthModal UI.
 * It does NOT fire the native One-Tap popup directly — that was removed
 * because it caused the FedCM NetworkError console warning.
 */
import { useEffect, useRef } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function GoogleOneTapPrompt() {
  const { isLoggedIn, openAuthModal } = useCustomerAuth()
  const hasFiredRef = useRef(false)

  useEffect(() => {
    // Already logged in — nothing to do
    if (isLoggedIn) return

    // Only auto-show once per browser session
    const key = 'tammo_auth_prompted'
    if (sessionStorage.getItem(key)) return
    if (hasFiredRef.current) return

    const timer = setTimeout(() => {
      hasFiredRef.current = true
      sessionStorage.setItem(key, '1')
      openAuthModal()
    }, 1500)

    return () => clearTimeout(timer)
    // openAuthModal is stable (useCallback with no changing deps in context)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  return null
}
