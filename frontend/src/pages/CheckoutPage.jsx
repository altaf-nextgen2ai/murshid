import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { orderService, settingsService } from '../services/api'
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './CheckoutPage.module.css'

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

const initialForm = {
  name: '', mobile: '', email: '',
  address: '', city: '', state: '', pincode: '', order_note: '',
}

export default function CheckoutPage() {
  const { items, subtotal, savings, clearCart } = useCart()
  const { customerUser } = useCustomerAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (customerUser) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || customerUser.name || '',
        email: prev.email || customerUser.email || '',
      }))
    }
  }, [customerUser])

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2>Your cart is empty</h2>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: 24 }}>Shop Now</Link>
      </div>
    )
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required'
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.address.trim()) e.address = 'Address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state) e.state = 'State is required'
    if (!form.pincode.trim()) e.pincode = 'Pincode is required'
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error('Please fix the errors')
      return
    }

    setLoading(true)
    const orderData = {
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: (customerUser?.email || form.email).trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state,
      pincode: form.pincode.trim(),
      order_note: form.order_note.trim(),
      items: items.map((item) => ({
        product_id: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    }

    try {
      const res = await orderService.create(orderData)
      const order = res.data
      clearCart()

      let num = '917042129273'
      try {
        const sRes = await settingsService.get()
        if (sRes.data?.whatsapp_number) num = sRes.data.whatsapp_number
      } catch (e) {}

      const cleanNum = String(num).replace(/\D/g, '') || '917042129273'
      const cust = order.customer || {}
      let itemsStr = ''
      order.items?.forEach((item) => {
        itemsStr += `\n• ${item.product_name_snapshot} (${item.size} / ${item.color}) x ${item.quantity} = Rs. ${parseFloat(item.subtotal).toLocaleString('en-IN')}`
      })

      const msg = `*NEW ORDER CONFIRMATION — TAMMO*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *Order ID:* ${order.order_number}\n` +
        `📄 *Invoice ID:* ${order.invoice_number}\n` +
        `👤 *Name:* ${cust.name || form.name}\n` +
        `📞 *Mobile:* ${cust.mobile || form.mobile}\n` +
        `📍 *Address:* ${cust.address || form.address}, ${cust.city || form.city}, ${cust.state || form.state} - ${cust.pincode || form.pincode}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛍️ *ITEMS ORDERED:*${itemsStr}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total Amount:* Rs. ${parseFloat(order.total).toLocaleString('en-IN')}\n\n` +
        `Please confirm my order!`

      const waUrl = `https://api.whatsapp.com/send?phone=${cleanNum}&text=${encodeURIComponent(msg)}`

      // Attempt to open WhatsApp window
      try {
        const opened = window.open(waUrl, '_blank')
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          // Popup blocked on mobile browser: navigate directly or handle in OrderConfirmation
          window.location.href = waUrl
        }
      } catch (e) {
        window.location.href = waUrl
      }

      navigate(`/order-confirmation/${order.order_number}`, { state: { order, waUrl, autoOpenWa: true } })
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const msg = Object.values(detail).flat().join(', ')
        toast.error(msg || 'Order failed. Please try again.')
      } else {
        toast.error('Order failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="container">
        <Link to="/cart" className={styles.backLink}>
          <FiArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 className={styles.title}>Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className={styles.layout}>
            {/* Form */}
            <div className={styles.formSection}>
              <div className={styles.formCard}>
                <h2 className={styles.cardTitle}>Delivery Information</h2>

                <div className={styles.formGrid}>
                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Rahul Sharma"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="7042129273"
                      maxLength={10}
                      className={`form-input ${errors.mobile ? 'error' : ''}`}
                    />
                    {errors.mobile && <span className="form-error">{errors.mobile}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Email Address {customerUser?.email && <span style={{ color: '#c8a96e', fontSize: '0.78rem' }}>(Google Account Linked)</span>}
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={customerUser?.email || form.email}
                      onChange={handleChange}
                      disabled={!!customerUser?.email}
                      placeholder="rahul@email.com"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Full Address *</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="House No., Street, Locality"
                      rows={3}
                      className={`form-input ${errors.address ? 'error' : ''}`}
                      style={{ resize: 'vertical' }}
                    />
                    {errors.address && <span className="form-error">{errors.address}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      className={`form-input ${errors.city ? 'error' : ''}`}
                    />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      maxLength={6}
                      className={`form-input ${errors.pincode ? 'error' : ''}`}
                    />
                    {errors.pincode && <span className="form-error">{errors.pincode}</span>}
                  </div>

                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">State *</label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className={`form-input ${errors.state ? 'error' : ''}`}
                    >
                      <option value="">Select State</option>
                      {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <span className="form-error">{errors.state}</span>}
                  </div>

                  <div className={`form-group ${styles.fullWidth}`}>
                    <label className="form-label">Order Note (Optional)</label>
                    <textarea
                      name="order_note"
                      value={form.order_note}
                      onChange={handleChange}
                      placeholder="Any special instructions..."
                      rows={2}
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.paymentNote}>
                <div className={styles.paymentNoteIcon}>💳</div>
                <div>
                  <strong>Payment: Cash on Delivery / WhatsApp</strong>
                  <p>Payment will be collected upon delivery or you can confirm via WhatsApp.</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.summary}>
              <h2 className={styles.cardTitle}>Order Summary</h2>
              <div className={styles.orderItems}>
                {items.map((item) => {
                  const price = item.discountPrice ?? item.price
                  return (
                    <div key={item.key} className={styles.orderItem}>
                      <div className={styles.orderItemImg}>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.name} />
                        ) : (
                          <FiShoppingBag size={20} color="#ccc" />
                        )}
                        <span className={styles.orderItemQty}>{item.quantity}</span>
                      </div>
                      <div className={styles.orderItemInfo}>
                        <p className={styles.orderItemName}>{item.name}</p>
                        <p className={styles.orderItemMeta}>{item.size} · {item.color}</p>
                      </div>
                      <span className={styles.orderItemPrice}>
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className={styles.summaryRows}>
                {savings > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Discount</span>
                    <span className={styles.discountVal}>-₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span className={styles.freeShip}>Free</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.placeOrderBtn}`}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : '🛍️ Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
