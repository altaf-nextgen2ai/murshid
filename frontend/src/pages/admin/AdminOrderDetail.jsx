import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { orderService, settingsService } from '../../services/api'
import { FiArrowLeft, FiDownload, FiMail, FiRefreshCw } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import styles from './AdminOrderDetail.module.css'

const ORDER_STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

const STATUS_CLASS = {
  new: 'status-new', confirmed: 'status-confirmed', packed: 'status-packed',
  shipped: 'status-shipped', delivered: 'status-delivered', cancelled: 'status-cancelled',
  pending: 'status-pending', paid: 'status-paid',
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [waNumber, setWaNumber] = useState('917042129273')

  useEffect(() => {
    Promise.all([
      orderService.adminGetById(id),
      settingsService.get(),
    ]).then(([orderRes, settingsRes]) => {
      setOrder(orderRes.data)
      setWaNumber(settingsRes.data.whatsapp_number || '917042129273')
    }).catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async (field, value) => {
    setUpdatingStatus(true)
    try {
      const res = await orderService.updateStatus(id, { [field]: value })
      setOrder(res.data)
      toast.success('Status updated!')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      await orderService.sendInvoice(id)
      toast.success('Invoice email sent!')
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleDownloadInvoice = () => {
    window.open(`/api/orders/${order.order_number}/invoice/`, '_blank')
  }

  const buildCustomerWhatsApp = () => {
    const c = order?.customer
    if (!c) return '#'
    const mobile = c.mobile.replace(/\D/g, '')
    const waNum = mobile.startsWith('91') ? mobile : `91${mobile}`
    const msg = `Hi ${c.name}! Your order ${order.order_number} status has been updated to: ${order.order_status_display}. Thank you for shopping with us!`
    return `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading order…</div>
  )

  if (!order) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>Order not found.</p>
      <Link to="/admin/orders" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>Back to Orders</Link>
    </div>
  )

  const customer = order.customer

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Link to="/admin/orders" className={styles.back}><FiArrowLeft size={16} /> Orders</Link>
          <h1>{order.order_number}</h1>
          <p>Invoice: {order.invoice_number} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={handleDownloadInvoice}>
            <FiDownload size={15} /> Download Invoice
          </button>
          <button className={styles.actionBtn} onClick={handleSendEmail} disabled={sendingEmail}>
            <FiMail size={15} /> {sendingEmail ? 'Sending…' : 'Email Invoice'}
          </button>
          <a href={buildCustomerWhatsApp()} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
            <FaWhatsapp size={16} /> WhatsApp Customer
          </a>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Left */}
        <div className={styles.mainCol}>
          {/* Items */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Items</h2>
            <div className={styles.tableWrap}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.productCell}>
                          {item.product_thumbnail_snapshot ? (
                            <img src={item.product_thumbnail_snapshot} alt="" className={styles.itemThumb} />
                          ) : (
                            <div className={styles.itemThumbEmpty} />
                          )}
                          <span>{item.product_name_snapshot}</span>
                        </div>
                      </td>
                      <td>{item.size}</td>
                      <td>{item.color}</td>
                      <td>{item.quantity}</td>
                      <td>₹{parseFloat(item.discount_price || item.price).toLocaleString('en-IN')}</td>
                      <td><strong>₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className={styles.totalRow}>
                  <span>Discount</span>
                  <span style={{ color: '#27ae60' }}>-₹{parseFloat(order.discount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <strong>₹{parseFloat(order.total).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* Order note */}
          {order.order_note && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Order Note</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{order.order_note}</p>
            </div>
          )}
        </div>

        {/* Right */}
        <div className={styles.sideCol}>
          {/* Status controls */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order Status</h2>
            <div className={styles.currentStatus}>
              <span className={`${styles.statusBadge} ${STATUS_CLASS[order.order_status]}`}>
                {order.order_status_display}
              </span>
              {updatingStatus && <FiRefreshCw size={14} className={styles.spinner} />}
            </div>
            <div className={styles.statusBtns}>
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  className={`${styles.statusBtn} ${order.order_status === s ? styles.statusBtnActive : ''}`}
                  onClick={() => handleStatusUpdate('order_status', s)}
                  disabled={updatingStatus || order.order_status === s}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment status */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Status</h2>
            <div className={styles.currentStatus}>
              <span className={`${styles.statusBadge} ${STATUS_CLASS[order.payment_status]}`}>
                {order.payment_status_display}
              </span>
            </div>
            <div className={styles.statusBtns}>
              {PAYMENT_STATUSES.map((s) => (
                <button
                  key={s}
                  className={`${styles.statusBtn} ${order.payment_status === s ? styles.statusBtnActive : ''}`}
                  onClick={() => handleStatusUpdate('payment_status', s)}
                  disabled={updatingStatus || order.payment_status === s}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Customer info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Customer</h2>
            <div className={styles.customerInfo}>
              <div className={styles.customerAvatar}>{customer?.name?.[0]?.toUpperCase()}</div>
              <div>
                <strong>{customer?.name}</strong>
                <p>{customer?.mobile}</p>
                {customer?.email && <p>{customer.email}</p>}
              </div>
            </div>
            <div className={styles.addressBlock}>
              <p className={styles.addressLabel}>Delivery Address</p>
              <p>{customer?.address}</p>
              <p>{customer?.city}, {customer?.state} – {customer?.pincode}</p>
            </div>
            <Link to={`/admin/customers/${customer?.id}`} className={styles.viewCustomerLink}>
              View Customer Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
