import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './AdminNavbar.module.css'

export default function AdminNavbar() {
  const { user } = useAuth()

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.greeting}>
            Welcome back, <strong>{user?.username || 'Admin'}</strong>
          </span>
        </div>
        <div className={styles.right}>
          <Link to="/" target="_blank" className={styles.viewSiteBtn}>
            View Store ↗
          </Link>
        </div>
      </div>
    </header>
  )
}
