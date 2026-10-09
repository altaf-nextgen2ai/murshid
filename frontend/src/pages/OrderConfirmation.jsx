import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { orderService, settingsService } from '../services/api'
import { FiDownload, FiCheckCircle, FiShoppingBag } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import styles from './OrderConfirmation.module.css'

export default function OrderConfirmation() {
  const { orderNumber } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!order)
  const [waNumber, setWaNumber] = useState('917042129273')

  useEffect(() => {
    settingsService.get().then((r) => setWaNumber(r.data.whatsapp_number)).catch(() => {})
    if (!order) {
      orderService.getByOrderNumber(orderNumber)
        .then((r) => setOrder(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  const buildWhatsAppMessage = (ord) => {
    if (location.state?.waUrl) return location.state.waUrl
    if (!ord) return `https://api.whatsapp.com/send?phone=${waNumber}`
    const customer = ord.customer || {}
    let items = ''
    ord.items?.forEach((item) => {
      items += `\n• ${item.product_name_snapshot} (${item.size} / ${item.color}) x ${item.quantity} = Rs. ${parseFloat(item.subtotal).toLocaleString('en-IN')}`
    })

    const cleanNum = String(waNumber).replace(/\D/g, '') || '917042129273'

    const msg = `*NEW ORDER CONFIRMATION — TAMMO*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Order ID:* ${ord.order_number}\n` +
      `📄 *Invoice ID:* ${ord.invoice_number}\n` +
      `👤 *Name:* ${customer.name || ''}\n` +
      `📞 *Mobile:* ${customer.mobile || ''}\n` +
      `📍 *Address:* ${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} - ${customer.pincode || ''}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛍️ *ITEMS ORDERED:*${items}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total Amount:* Rs. ${parseFloat(ord.total).toLocaleString('en-IN')}\n\n` +
      `Please confirm my order!`

    return `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(msg)}`
  }

  const handleDownload = () => {
    window.open(`/api/orders/${orderNumber}/invoice/`, '_blank')
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px' }} />
        <div className="skeleton" style={{ width: 300, height: 32, margin: '0 auto 16px' }} />
        <div className="skeleton" style={{ width: 200, height: 20, margin: '0 auto' }} />
      </div>
    )
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="container">
        <div className={styles.card}>
          {/* Success header */}
          <div className={styles.successHeader}>
            <div className={styles.successIcon}>
              <FiCheckCircle size={48} />
            </div>
            <h1>Order Confirmed! 🎉</h1>
            <p>Thank you for your order. We'll process it soon!</p>
            <div className={styles.orderIdBadge}>
              Order ID: <strong>{orderNumber}</strong>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className={styles.ctaBtns}>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <FiDownload size={18} /> Download Invoice
            </button>
            <a
              href={buildWhatsAppMessage(order)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waBtn}
            >
              <FaWhatsapp size={20} /> Send Order on WhatsApp
            </a>
            <Link to="/shop" className={styles.shopBtn}>
              <FiShoppingBag size={18} /> Continue Shopping
            </Link>
          </div>

          {/* Order details */}
          {order && (
            <div className={styles.details}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailBlock}>
                  <h3>Customer Details</h3>
                  <p><strong>{order.customer?.name}</strong></p>
                  <p>{order.customer?.mobile}</p>
                  {order.customer?.email && <p>{order.customer.email}</p>}
                  <p>{order.customer?.address}</p>
                  <p>{order.customer?.city}, {order.customer?.state} – {order.customer?.pincode}</p>
                </div>
                <div className={styles.detailBlock}>
                  <h3>Order Info</h3>
                  <p><span>Invoice #:</span> <strong>{order.invoice_number}</strong></p>
                  <p><span>Date:</span> {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><span>Payment:</span> <span className={styles.pendingBadge}>{order.payment_status_display}</span></p>
                  <p><span>Status:</span> <span className={styles.statusBadge}>{order.order_status_display}</span></p>
                </div>
              </div>

              <div className={styles.itemsTable}>
                <h3>Items Ordered</h3>
                <table>
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
                        <td>{item.product_name_snapshot}</td>
                        <td>{item.size}</td>
                        <td>{item.color}</td>
                        <td>{item.quantity}</td>
                        <td>₹{parseFloat(item.discount_price || item.price).toLocaleString('en-IN')}</td>
                        <td>₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
          )}

          <div className={styles.waNote}>
            <FaWhatsapp size={20} color="#25D366" />
            <p>Click "Send Order on WhatsApp" to open WhatsApp with your order details pre-filled. Simply press Send to confirm your order with us.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
