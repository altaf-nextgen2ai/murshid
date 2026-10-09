import { useState, useEffect } from 'react'
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { settingsService } from '../services/api'
import styles from './Contact.module.css'

export default function Contact() {
  const [settings, setSettings] = useState({
    business_name: 'Tammo',
    business_email: 'murshid10032004@gmail.com',
    business_phone: '+91 70421 29273',
    business_address: 'Mumbai, Maharashtra, India',
    whatsapp_number: '917042129273',
  })

  useEffect(() => {
    settingsService.get().then((r) => setSettings(r.data)).catch(() => {})
  }, [])

  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.header}>
        <div className="container">
          <p className="section-label">Get In Touch</p>
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle">We'd love to hear from you. Reach out via WhatsApp, email, or give us a call.</p>
        </div>
      </div>

      <section className="section-pad">
        <div className="container">
          <div className={styles.layout}>
            <div className={styles.infoCol}>
              <h2 className={styles.infoTitle}>Reach Us</h2>
              <div className={styles.contactItems}>
                {settings.business_email && (
                  <a href={`mailto:${settings.business_email}`} className={styles.contactItem}>
                    <div className={styles.contactIcon}><FiMail size={20} /></div>
                    <div>
                      <h4>Email</h4>
                      <p>{settings.business_email}</p>
                    </div>
                  </a>
                )}
                {settings.business_phone && (
                  <a href={`tel:${settings.business_phone}`} className={styles.contactItem}>
                    <div className={styles.contactIcon}><FiPhone size={20} /></div>
                    <div>
                      <h4>Phone</h4>
                      <p>{settings.business_phone}</p>
                    </div>
                  </a>
                )}
                {settings.business_address && (
                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}><FiMapPin size={20} /></div>
                    <div>
                      <h4>Address</h4>
                      <p>{settings.business_address}</p>
                    </div>
                  </div>
                )}
              </div>

              <a
                href={`https://wa.me/${settings.whatsapp_number}?text=Hi! I'd like to get in touch with Murshid.`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waCard}
              >
                <FaWhatsapp size={36} />
                <div>
                  <h3>WhatsApp Us</h3>
                  <p>Quickest way to reach us. We reply fast!</p>
                  <span>+{settings.whatsapp_number}</span>
                </div>
              </a>
            </div>

            <div className={styles.formCol}>
              <h2 className={styles.infoTitle}>Send a Message</h2>
              <div className={styles.formNote}>
                <p>📱 For the fastest response, contact us on WhatsApp. We'll get back to you within minutes!</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input className="form-input" placeholder="Rahul Sharma" disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="rahul@email.com" disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={4} placeholder="Your message..." disabled style={{ resize: 'vertical' }} />
                </div>
                <a
                  href={`https://wa.me/${settings.whatsapp_number}?text=Hi! I have a query.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn ${styles.waFormBtn}`}
                >
                  <FaWhatsapp size={18} />
                  Contact on WhatsApp Instead
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
