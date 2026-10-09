import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WhatsAppFloat from '../components/WhatsAppFloat'
import BackToTop from '../components/BackToTop'
import GoogleOneTapPrompt from '../components/GoogleOneTapPrompt'
import GoogleAuthModal from '../components/GoogleAuthModal'

export default function CustomerLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/*
        GoogleOneTapPrompt — renders nothing, just fires openAuthModal()
        once per session after 1.5 s if the user is not signed in.
      */}
      <GoogleOneTapPrompt />

      {/*
        GoogleAuthModal — the ONE place this modal is mounted.
        It reads isModalOpen from CustomerAuthContext so any caller
        (cart, navbar, one-tap) can open it without extra prop-drilling.
      */}
      <GoogleAuthModal />

      <Navbar />
      <main style={{ flex: 1, paddingTop: '102px' }}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <BackToTop />
    </div>
  )
}
