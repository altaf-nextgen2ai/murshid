import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { customerService } from '../../services/api'
import { FiSearch, FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './AdminCustomers.module.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    customerService.getAll()
      .then((r) => { setCustomers(r.data || []); setFiltered(r.data || []) })
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q
        ? customers.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.mobile.includes(q) ||
              (c.email || '').toLowerCase().includes(q)
          )
        : customers
    )
  }, [search, customers])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Customers</h1>
          <p>{filtered.length} customers</p>
        </div>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, mobile or email…"
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
                <th>Customer</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>City</th>
                <th>Total Orders</th>
                <th>Total Value</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>
                    {search ? 'No customers match your search' : 'No customers yet'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.customerCell}>
                        <div className={styles.avatar}>{c.name[0].toUpperCase()}</div>
                        <span className={styles.customerName}>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.mobile}</td>
                    <td className={styles.emailCell}>{c.email || <span className={styles.muted}>—</span>}</td>
                    <td>{c.city || <span className={styles.muted}>—</span>}</td>
                    <td>
                      <span className={styles.orderCount}>{c.total_orders}</span>
                    </td>
                    <td>
                      <strong>₹{parseFloat(c.total_order_value || 0).toLocaleString('en-IN')}</strong>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Link to={`/admin/customers/${c.id}`} className={styles.viewBtn}>
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
