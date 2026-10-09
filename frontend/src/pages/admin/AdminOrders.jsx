import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { orderService } from '../../services/api'
import { FiEye, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './AdminOrders.module.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_CLASS = {
  new: 'status-new', confirmed: 'status-confirmed', packed: 'status-packed',
  shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const statusFilter = searchParams.get('status') || ''

  const load = () => {
    setLoading(true)
    orderService.adminList({ status: statusFilter, search })
      .then((r) => setOrders(r.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, search])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Orders</h1>
          <p>{orders.length} orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className={styles.tabs}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.tab} ${statusFilter === opt.value ? styles.tabActive : ''}`}
            onClick={() => {
              const next = new URLSearchParams()
              if (opt.value) next.set('status', opt.value)
              setSearchParams(next)
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by order ID or customer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    {statusFilter ? `No ${statusFilter} orders` : 'No orders yet'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong className={styles.orderId}>{order.order_number}</strong></td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_mobile}</td>
                    <td><strong>₹{parseFloat(order.total).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`${styles.badge} ${STATUS_CLASS[order.order_status]}`}>
                        {order.order_status_display}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${order.payment_status === 'paid' ? 'status-paid' : 'status-pending'}`}>
                        {order.payment_status_display}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <Link to={`/admin/orders/${order.id}`} className={styles.viewBtn} title="View">
                        <FiEye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
