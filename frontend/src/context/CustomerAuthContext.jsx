import { createContext, useContext, useState, useRef } from 'react'
import { authService } from '../services/api'
import toast from 'react-hot-toast'
import GoogleAuthModal from '../components/GoogleAuthModal'

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

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const pendingActionRef = useRef(null)

  const openAuthModal = (onSuccessAction) => {
    if (typeof onSuccessAction === 'function') {
      pendingActionRef.current = onSuccessAction
    } else {
      pendingActionRef.current = null
    }
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
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
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </CustomerAuthContext.Provider>
  )
}

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  return ctx
}
