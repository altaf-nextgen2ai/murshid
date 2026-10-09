import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FiSearch, FiShoppingBag, FiX, FiMenu } from 'react-icons/fi'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { itemCount } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/shop/category/Men', label: 'Men' },
    { to: '/shop/category/Women', label: 'Women' },
    { to: '/shop?is_new_arrival=true', label: 'New Arrivals' },
    { to: '/shop?is_trending=true', label: 'Trending' },
  ]

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>

          {/* Mobile: Hamburger */}
          <button
            className={`${styles.iconBtn} ${styles.mobileOnly}`}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={22} />
          </button>

          {/* Logo — clean image mark only */}
          <Link to="/" className={styles.logo} aria-label="Go to home">
            <div className={styles.logoMark}>
              <img src="/logo.jpeg" alt="Brand logo" className={styles.logoImg} />
              <div className={styles.logoGlow} />
            </div>
          </Link>

          {/* Desktop nav links */}
          <ul className={`${styles.navLinks} ${styles.desktopOnly}`}>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <FiSearch size={20} />
            </button>
            <Link to="/cart" className={styles.cartBtn} aria-label="Cart">
              <FiShoppingBag size={20} />
              {itemCount > 0 && (
                <span className={styles.cartCount}>{itemCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className={styles.searchOverlay}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <FiSearch size={20} className={styles.searchIcon} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                aria-label="Close search"
              >
                <FiX size={20} />
              </button>
            </form>
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.mobileSidebar} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileSidebarHeader}>
              <Link to="/" className={styles.mobileLogo} onClick={() => setMobileOpen(false)}>
                <div className={styles.mobileLogoMark}>
                  <img src="/logo.jpeg" alt="Brand logo" className={styles.mobileLogoImg} />
                </div>
              </Link>
              <button className={styles.iconBtn} onClick={() => setMobileOpen(false)}>
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSearch} className={styles.mobileSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.mobileSearchInput}
              />
              <button type="submit" className={styles.mobileSearchBtn}>
                <FiSearch size={16} />
              </button>
            </form>

            <ul className={styles.mobileNavLinks}>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `${styles.mobileNavLink} ${isActive ? styles.mobileActive : ''}`
                    }
                    onClick={() => setMobileOpen(false)}
                    end={link.to === '/'}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <Link
                  to="/cart"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileOpen(false)}
                >
                  Cart {itemCount > 0 && `(${itemCount})`}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
