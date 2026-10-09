import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('adminUser')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await authService.login({ username, password })
      const { access, refresh, user: userData } = res.data
      localStorage.setItem('adminToken', access)
      localStorage.setItem('adminRefresh', refresh)
      localStorage.setItem('adminUser', JSON.stringify(userData))
      setToken(access)
      setUser(userData)
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Login failed',
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    const refresh = localStorage.getItem('adminRefresh')
    if (refresh) {
      authService.logout(refresh).catch(() => {})
    }
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefresh')
    localStorage.removeItem('adminUser')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
