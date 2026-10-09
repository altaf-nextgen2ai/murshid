import { Link } from 'react-router-dom'
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { settingsService } from '../services/api'
import styles from './Footer.module.css'

export default function Footer() {
  const [settings, setSettings] = useState({ 
    business_name: 'Tammo', 
    whatsapp_number: '917042129273',
    business_phone: '+91 70421 29273',
    business_email: 'murshid10032004@gmail.com'
  })

  useEffect(() => {
    settingsService.get()
      .then((res) => setSettings(prev => ({ ...prev, ...res.data })))
      .catch(() => {})
  }, [])

  const waUrl = `https://wa.me/${settings.whatsapp_number}`

  return (
    <footer className={styles.footer}>
      {/* WhatsApp CTA Banner */}
      <div className={styles.waBanner}>
        <div className="container">
          <div className={styles.waBannerInner}>
            <div className={styles.waBannerText}>
              <h3>Order Directly on WhatsApp</h3>
              <p>Call or chat with us for instant assistance & order confirmation (+91 70421 29273)</p>
            </div>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
              <FaWhatsapp size={20} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className="container">
          <div className={styles.grid}>
            {/* Brand */}
            <div className={styles.brand}>
              <Link to="/" className={styles.logoWrap}>
                <div className={styles.logoImgWrap}>
                  <img src="/logo.jpeg" alt="Brand logo" className={styles.logoImg} />
                </div>
              </Link>
              <p className={styles.tagline}>
                Modern fashion for the bold generation. Premium streetwear crafted with purpose.
              </p>
              <div className={styles.socials}>
                <a href="#" aria-label="Instagram"><FiInstagram size={18} /></a>
                <a href="#" aria-label="Twitter"><FiTwitter size={18} /></a>
                <a href="#" aria-label="Facebook"><FiFacebook size={18} /></a>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <FaWhatsapp size={18} />
                </a>
              </div>
            </div>

            {/* Shop */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Shop</h4>
              <ul>
                <li><Link to="/shop">All Products</Link></li>
                <li><Link to="/shop/category/Men">Men</Link></li>
                <li><Link to="/shop/category/Women">Women</Link></li>
                <li><Link to="/shop?is_new_arrival=true">New Arrivals</Link></li>
                <li><Link to="/shop?is_trending=true">Trending</Link></li>
                <li><Link to="/shop?is_best_seller=true">Best Sellers</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className={styles.linkCol}>
              <h4 className={styles.colTitle}>Get In Touch</h4>
              <ul className={styles.contactList}>
                {settings.business_email && (
                  <li>
                    <FiMail size={14} />
                    <a href={`mailto:${settings.business_email}`}>{settings.business_email}</a>
                  </li>
                )}
                <li>
                  <FiPhone size={14} />
                  <a href={`tel:${settings.business_phone?.includes('98765') ? '7042129273' : (settings.business_phone || '7042129273')}`}>
                    {settings.business_phone?.includes('98765') ? '+91 70421 29273' : (settings.business_phone || '+91 70421 29273')}
                  </a>
                </li>
                <li>
                  <FaWhatsapp size={14} />
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    WhatsApp: +91 70421 29273
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p>© {new Date().getFullYear()} {settings.business_name || 'Murshid'}. All rights reserved.</p>
            <p className={styles.devCredit}>
              Developed by <a href="https://skyranksolution.com" target="_blank" rel="noopener noreferrer" className={styles.devLink}>Skyrank Solution</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
