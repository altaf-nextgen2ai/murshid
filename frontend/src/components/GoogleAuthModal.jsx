import { useState, useEffect, useRef } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { FiX, FiCheckCircle, FiMail } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import styles from './GoogleAuthModal.module.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173907682716-q2gape30qtu66gs1k8gv21bemrmvm9rb.apps.googleusercontent.com'

export default function GoogleAuthModal({ isOpen, onClose, onSuccess }) {
  const { googleLogin, customerUser, logoutCustomer } = useCustomerAuth()
  const [emailInput, setEmailInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [loading, setLoading] = useState(false)
  const googleBtnContainerRef = useRef(null)

  useEffect(() => {
    if (!isOpen || customerUser) return

    const renderOfficialGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
        googleBtnContainerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        })
      }
    }

    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = renderOfficialGoogleButton
      document.body.appendChild(script)
    } else {
      renderOfficialGoogleButton()
    }
  }, [isOpen, customerUser])

  if (!isOpen) return null

  const handleGoogleResponse = async (response) => {
    if (response.credential) {
      setLoading(true)
      const res = await googleLogin({ credential: response.credential })
      setLoading(false)
      if (res.success) {
        if (onSuccess) onSuccess()
        onClose()
      }
    }
  }

  const handleRealEmailSignIn = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return
    setLoading(true)
    const email = emailInput.trim()
    const name = nameInput.trim() || email.split('@')[0]
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    
    const res = await googleLogin({
      email: email,
      name: name,
      picture: avatar,
    })
    setLoading(false)
    if (res.success) {
      if (onSuccess) onSuccess()
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX size={20} />
        </button>

        {customerUser ? (
          <div className={styles.loggedInBox}>
            <img
              src={customerUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerUser.name || 'User')}`}
              alt={customerUser.name}
              className={styles.userAvatar}
            />
            <h3>Signed in as {customerUser.name}</h3>
            <p className={styles.userEmail}>{customerUser.email}</p>
            <div className={styles.badge}><FiCheckCircle size={14} /> Authenticated with Google</div>
            
            <button className="btn btn-secondary" style={{ marginTop: 20, width: '100%' }} onClick={logoutCustomer}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.iconCircle}>
                <FcGoogle size={32} />
              </div>
              <h2>Sign in with Google</h2>
              <p>Sign in using your Google account to track orders & auto-fill checkout details.</p>
            </div>

            {/* Official Google Identity Button */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }} ref={googleBtnContainerRef}></div>

            <div className={styles.divider}>
              <span>OR ENTER YOUR REAL GOOGLE EMAIL</span>
            </div>

            <form onSubmit={handleRealEmailSignIn} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Google Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In with Email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
