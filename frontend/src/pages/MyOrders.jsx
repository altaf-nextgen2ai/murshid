import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { orderService } from '../services/api'
import { FiShoppingBag, FiDownload, FiSearch, FiPackage, FiCalendar } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import styles from './MyOrders.module.css'

export default function MyOrders() {
  const { customerUser, isLoggedIn } = useCustomerAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = async (emailOrMobile) => {
    if (!emailOrMobile) return
    setLoading(true)
    try {
      const isEmail = emailOrMobile.includes('@')
      const params = isEmail ? { email: emailOrMobile } : { mobile: emailOrMobile }
      const res = await orderService.getMyOrders(params)
      setOrders(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerUser?.email) {
      fetchOrders(customerUser.email)
    }
  }, [customerUser])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      fetchOrders(searchQuery.trim())
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Delivered</span>
      case 'shipped':
        return <span className={`${styles.badge} ${styles.badgeInfo}`}>Shipped</span>
      case 'confirmed':
        return <span className={`${styles.badge} ${styles.badgePrimary}`}>Confirmed</span>
      case 'cancelled':
        return <span className={`${styles.badge} ${styles.badgeDanger}`}>Cancelled</span>
      default:
        return <span className={`${styles.badge} ${styles.badgeWarning}`}>New Order</span>
    }
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Order History</h1>
            <p className={styles.subtitle}>View and track all your past fashion orders</p>
          </div>

        {isLoggedIn && (
          <div className={styles.userInfo}>
            <img
              src={customerUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${customerUser.name}`}
              alt={customerUser.name}
              className={styles.userAvatar}
            />
            <div>
              <strong>{customerUser.name}</strong>
              <span>{customerUser.email}</span>
            </div>
          </div>
        )}
        </div>

        {/* Search bar for finding orders by mobile / email */}
        <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
          <input
            type="text"
            placeholder="Enter Email Address or Mobile Number to search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
          <button type="submit" className="btn btn-primary">
            <FiSearch size={16} /> Search Orders
          </button>
        </form>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="skeleton" style={{ width: '100%', height: 180, marginBottom: 16, borderRadius: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12 }} />
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiPackage size={44} />
            </div>
            <h3>No Orders Found</h3>
            <p>
              {!isLoggedIn
                ? 'Enter your mobile number or email address above to search and track your orders.'
                : 'You have not placed any orders yet.'}
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/shop" className="btn btn-primary">
                Explore Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((ord) => (
              <div key={ord.id} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderId}>Order #{ord.order_number}</span>
                      {getStatusBadge(ord.order_status)}
                    </div>
                    <div className={styles.dateInfo}>
                      <FiCalendar size={14} />
                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className={styles.headerRight}>
                    <div className={styles.totalPrice}>
                      ₹{parseFloat(ord.total).toLocaleString('en-IN')}
                    </div>
                    <span className={styles.paymentBadge}>{ord.payment_status_display}</span>
                  </div>
                </div>

                {/* Items */}
                <div className={styles.itemsList}>
                  {ord.items?.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <div className={styles.itemImg}>
                        {item.product_thumbnail_snapshot ? (
                          <img src={item.product_thumbnail_snapshot} alt={item.product_name_snapshot} />
                        ) : (
                          <FiShoppingBag size={20} color="#ccc" />
                        )}
                      </div>
                      <div className={styles.itemMeta}>
                        <h4 className={styles.itemName}>{item.product_name_snapshot}</h4>
                        <p className={styles.itemSpecs}>
                          Size: <strong>{item.size}</strong> · Color: <strong>{item.color}</strong> · Qty: <strong>{item.quantity}</strong>
                        </p>
                      </div>
                      <div className={styles.itemSubtotal}>
                        ₹{parseFloat(item.subtotal).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className={styles.cardFooter}>
                  <div className={styles.customerSummary}>
                    Deliver To: <strong>{ord.customer?.name}</strong> ({ord.customer?.city})
                  </div>
                  <div className={styles.actionBtns}>
                    <a
                      href={`/api/orders/${ord.order_number}/invoice/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <FiDownload size={14} /> Invoice PDF
                    </a>
                    <Link
                      to={`/order-confirmation/${ord.order_number}`}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      View Receipt
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
