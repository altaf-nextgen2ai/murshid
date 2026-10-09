import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FiGrid, FiPackage, FiTag, FiShoppingCart,
  FiUsers, FiSettings, FiLogOut, FiMenu, FiX
} from 'react-icons/fi'
import styles from './AdminSidebar.module.css'

const menu = [
  { to: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/admin/products', icon: FiPackage, label: 'Products' },
  { to: '/admin/categories', icon: FiTag, label: 'Categories' },
  { to: '/admin/orders', icon: FiShoppingCart, label: 'Orders' },
  { to: '/admin/customers', icon: FiUsers, label: 'Customers' },
  { to: '/admin/settings', icon: FiSettings, label: 'Settings' },
]

export default function AdminSidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const SidebarContent = () => (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoImgWrap}>
          <img src="/logo.jpeg" alt="Brand" className={styles.logo} />
        </div>
        <div>
          <div className={styles.brandSub}>Admin Panel</div>
        </div>
      </div>

      {user && (
        <div className={styles.userCard}>
          <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
          <div>
            <div className={styles.userName}>{user.username}</div>
            <div className={styles.userRole}>{user.is_superuser ? 'Super Admin' : 'Admin'}</div>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        {menu.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <FiLogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <FiMenu size={22} />
      </button>

      {/* Desktop sidebar */}
      <div className={styles.desktopSidebar}>
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}>
              <FiX size={22} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
