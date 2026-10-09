import { useState, useEffect } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { settingsService } from '../services/api'
import styles from './WhatsAppFloat.module.css'

export default function WhatsAppFloat() {
  const [waNumber, setWaNumber] = useState('917042129273')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    settingsService.get()
      .then((res) => setWaNumber(res.data.whatsapp_number))
      .catch(() => {})
  }, [])

  if (!visible) return null

  return (
    <a
      href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent("Hi! I'd like to know more about your products.")}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.float}
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp size={28} />
      <span className={styles.tooltip}>Chat with us</span>
    </a>
  )
}
