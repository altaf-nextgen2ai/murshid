import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService, productService, customerService } from '../../services/api'
import { FiPackage, FiShoppingCart, FiUsers, FiDollarSign, FiTrendingUp, FiEye } from 'react-icons/fi'
import styles from './AdminDashboard.module.css'

const STATUS_COLORS = {
  new: '#1565c0', confirmed: '#2e7d32', packed: '#e65100',
  shipped: '#6a1b9a', delivered: '#1b5e20', cancelled: '#b71c1c',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [productCount, setProductCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      orderService.getStats(),
      orderService.adminList(),
      productService.adminList(),
      customerService.getAll(),
    ]).then(([statsRes, ordersRes, prodsRes, custsRes]) => {
      setStats(statsRes.data)
      setRecentOrders((ordersRes.data || []).slice(0, 8))
      setProductCount((prodsRes.data || []).length)
      setCustomerCount((custsRes.data || []).length)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Products', value: productCount, icon: FiPackage, color: '#667eea', link: '/admin/products' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: FiShoppingCart, color: '#f093fb', link: '/admin/orders' },
    { label: 'New Orders', value: stats?.new_orders || 0, icon: FiTrendingUp, color: '#4facfe', link: '/admin/orders?status=new' },
    { label: 'Delivered', value: stats?.delivered_orders || 0, icon: FiDollarSign, color: '#43e97b', link: '/admin/orders?status=delivered' },
    { label: 'Confirmed', value: stats?.confirmed_orders || 0, icon: FiShoppingCart, color: '#f7971e', link: '/admin/orders?status=confirmed' },
    { label: 'Customers', value: customerCount, icon: FiUsers, color: '#a18cd1', link: '/admin/customers' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
        <p>Welcome to your store admin panel</p>
      </div>

      {/* Stats cards */}
      <div className={styles.cards}>
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className={styles.card}>
            <div className={styles.cardIcon} style={{ background: card.color + '20', color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardValue}>
                {loading ? <div className="skeleton" style={{ width: 40, height: 28 }} /> : card.value}
              </div>
              <div className={styles.cardLabel}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue card */}
      {stats && (
        <div className={styles.revenueCard}>
          <div className={styles.revenueLeft}>
            <p className={styles.revenueLabel}>Total Order Value</p>
            <h2 className={styles.revenueValue}>
              ₹{(stats.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h2>
          </div>
          <div className={styles.revenueRight}>
            <FiTrendingUp size={48} />
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Orders</h2>
          <Link to="/admin/orders" className={styles.viewAll}>View All</Link>
        </div>
        <div className={styles.tableWrap}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j}>
                        <div className="skeleton" style={{ height: 16, borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '32px' }}>
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_mobile}</td>
                    <td>₹{parseFloat(order.total).toLocaleString('en-IN')}</td>
                    <td>
                      <span
                        className={`badge ${styles.statusBadge}`}
                        style={{
                          background: STATUS_COLORS[order.order_status] + '20',
                          color: STATUS_COLORS[order.order_status],
                        }}
                      >
                        {order.order_status_display}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <Link to={`/admin/orders/${order.id}`} className={styles.viewBtn}>
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
