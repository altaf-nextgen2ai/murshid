import { useEffect } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function GoogleOneTapPrompt() {
  const { isLoggedIn, openAuthModal } = useCustomerAuth()

  useEffect(() => {
    if (isLoggedIn) return
    const timer = setTimeout(() => {
      openAuthModal()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isLoggedIn, openAuthModal])

  return null
}

