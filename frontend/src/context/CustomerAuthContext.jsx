import { createContext, useContext, useState, useRef } from 'react'
import { authService } from '../services/api'
import toast from 'react-hot-toast'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173907682716-q2gape30qtu66gs1k8gv21bemrmvm9rb.apps.googleusercontent.com'

const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem('customerUser')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const pendingActionRef = useRef(null)
  const isGisInitializedRef = useRef(false)

  const clearGoogleCooldown = () => {
    try {
      document.cookie = 'g_state=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    } catch (e) {
      // ignore
    }
  }

  const handleCredentialResponse = async (response) => {
    if (response.credential) {
      await googleLogin({ credential: response.credential })
    }
  }

  const initGis = () => {
    if (window.google?.accounts?.id && !isGisInitializedRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true,
        })
        isGisInitializedRef.current = true
      } catch (err) {
        console.error('[GIS Init Error]:', err)
      }
    }
  }

  const triggerPrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason()
          console.log('[Google One-Tap] Not displayed reason:', reason)
          if (reason === 'opt_out_or_dismissed' || reason === 'exponential_cooldown') {
            clearGoogleCooldown()
          }
        }
      })
    }
  }

  const openAuthModal = (onSuccessAction) => {
    if (typeof onSuccessAction === 'function') {
      pendingActionRef.current = onSuccessAction
    } else {
      pendingActionRef.current = null
    }

    clearGoogleCooldown()

    if (!window.google?.accounts?.id) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        initGis()
        triggerPrompt()
      }
      document.body.appendChild(script)
    } else {
      initGis()
      triggerPrompt()
    }
  }

  const googleLogin = async (data) => {
    try {
      const res = await authService.googleLogin(data)
      const userData = res.data.user
      const access = res.data.access
      const fullUser = { ...userData, token: access }
      
      localStorage.setItem('customerUser', JSON.stringify(fullUser))
      setCustomerUser(fullUser)
      toast.success(`Welcome back, ${fullUser.name || 'Customer'}! 👋`)
      
      if (pendingActionRef.current) {
        const action = pendingActionRef.current
        pendingActionRef.current = null
        action()
      }
      return { success: true, user: fullUser }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google Login failed. Please try again.')
      return { success: false }
    }
  }

  const logoutCustomer = () => {
    localStorage.removeItem('customerUser')
    setCustomerUser(null)
    toast.success('Logged out successfully.')
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        customerUser,
        googleLogin,
        logoutCustomer,
        isLoggedIn: !!customerUser,
        openAuthModal,
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

