import { useEffect, useRef } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'

// You can set VITE_GOOGLE_CLIENT_ID in frontend/.env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173907682716-q2gape30qtu66gs1k8gv21bemrmvm9rb.apps.googleusercontent.com'

export default function GoogleOneTapPrompt() {
  const { isLoggedIn, googleLogin } = useCustomerAuth()
  const initialized = useRef(false)

  useEffect(() => {
    if (isLoggedIn || initialized.current) return

    const loadGisScript = () => {
      if (window.google?.accounts?.id) {
        initOneTap()
      } else {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initOneTap
        document.body.appendChild(script)
      }
    }

    const initOneTap = () => {
      try {
        initialized.current = true
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        })

        // Prompt user automatically on site visit
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log('[Google One-Tap] Not displayed:', notification.getNotDisplayedReason())
          }
        })
      } catch (err) {
        console.error('[Google One-Tap Init Error]:', err)
      }
    }

    const handleCredentialResponse = async (response) => {
      if (response.credential) {
        await googleLogin({ credential: response.credential })
      }
    }

    loadGisScript()
  }, [isLoggedIn, googleLogin])

  return null
}
