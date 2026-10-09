import { FiTruck, FiPackage, FiTag } from 'react-icons/fi'
import styles from './AnnouncementBar.module.css'

export default function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.item}>
        <FiTruck size={14} className={styles.icon} />
        <span>FREE SHIPPING ON ALL ORDERS</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.item}>
        <FiPackage size={14} className={styles.icon} />
        <span>EASY 7-DAY RETURNS</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.item}>
        <FiTag size={14} className={styles.icon} />
        <span>PREMIUM QUALITY</span>
      </div>
    </div>
  )
}
