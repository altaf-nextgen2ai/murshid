import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import AdminNavbar from '../components/AdminNavbar'
import styles from './AdminLayout.module.css'

export default function AdminLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminNavbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
