import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const { login, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!credentials.username.trim()) errs.username = 'Username is required'
    if (!credentials.password.trim()) errs.password = 'Password is required'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const result = await login(credentials.username, credentials.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/admin/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <img src="/logo.jpeg" alt="Brand" className={styles.logo} />
          </div>
          <div className={styles.brandText}>
            <div className={styles.brandSub}>Admin Control Panel</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>Sign In</h2>
          <p className={styles.subtitle}>Enter your credentials to access the dashboard</p>

          <div className={styles.field}>
            <label>Username</label>
            <div className={styles.inputWrap}>
              <FiUser size={16} className={styles.inputIcon} />
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials((p) => ({ ...p, username: e.target.value }))}
                placeholder="admin"
                className={errors.username ? styles.inputError : ''}
                autoFocus
              />
            </div>
            {errors.username && <span className={styles.err}>{errors.username}</span>}
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.inputWrap}>
              <FiLock size={16} className={styles.inputIcon} />
              <input
                type={showPass ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className={errors.password ? styles.inputError : ''}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <span className={styles.err}>{errors.password}</span>}
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.hint}>Default: admin / admin123</p>
      </div>
    </div>
  )
}
