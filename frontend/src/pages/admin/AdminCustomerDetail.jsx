import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { customerService } from '../../services/api'
import { FiArrowLeft } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import styles from './AdminCustomerDetail.module.css'

const STATUS_CLASS = {
  new: 'status-new', confirmed: 'status-confirmed', packed: 'status-packed',
  shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled',
}

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerService.getOrders(id)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load customer'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
  if (!data) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>Customer not found.</p>
      <Link to="/admin/customers" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>Back</Link>
    </div>
  )

  const { customer, orders } = data
  const totalValue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0)
  const waNum = customer.mobile.replace(/\D/g, '')
  const waUrl = `https://wa.me/${waNum.startsWith('91') ? waNum : '91' + waNum}`

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/admin/customers" className={styles.back}><FiArrowLeft size={16} /> Customers</Link>
        <div className={styles.headerRow}>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>{customer.name[0].toUpperCase()}</div>
            <div>
              <h1>{customer.name}</h1>
              <p>{customer.mobile} {customer.email ? `· ${customer.email}` : ''}</p>
            </div>
          </div>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
            <FaWhatsapp size={16} /> WhatsApp
          </a>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left */}
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order History</h2>
            {orders.length === 0 ? (
              <p className={styles.empty}>No orders yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td><strong className={styles.orderId}>{o.order_number}</strong></td>
                        <td>₹{parseFloat(o.total).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`${styles.badge} ${STATUS_CLASS[o.order_status]}`}>
                            {o.order_status_display}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${o.payment_status === 'paid' ? 'status-paid' : 'status-pending'}`}>
                            {o.payment_status_display}
                          </span>
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <Link to={`/admin/orders/${o.id}`} className={styles.viewBtn}>View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className={styles.sideCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Stats</h2>
            <div className={styles.statItem}>
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Total Spent</span>
              <strong>₹{totalValue.toLocaleString('en-IN')}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Last Order</span>
              <strong>
                {orders.length > 0
                  ? new Date(orders[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </strong>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Address</h2>
            <p className={styles.addressLine}>{customer.address}</p>
            <p className={styles.addressLine}>{customer.city}, {customer.state}</p>
            <p className={styles.addressLine}>Pincode: {customer.pincode}</p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Joined</h2>
            <p style={{ fontSize: 14, color: '#555' }}>
              {new Date(customer.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
