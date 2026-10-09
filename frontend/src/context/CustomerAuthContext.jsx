import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'
import toast from 'react-hot-toast'

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

  const googleLogin = async (data) => {
    try {
      const res = await authService.googleLogin(data)
      const userData = res.data.user
      const access = res.data.access
      const fullUser = { ...userData, token: access }
      
      localStorage.setItem('customerUser', JSON.stringify(fullUser))
      setCustomerUser(fullUser)
      toast.success(`Welcome back, ${fullUser.name || 'Customer'}! 👋`)
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
