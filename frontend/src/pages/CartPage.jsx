import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { settingsService } from '../services/api'
import styles from './CartPage.module.css'

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, originalTotal, savings, itemCount } = useCart()
  const [waNumber, setWaNumber] = useState('917042129273')

  useEffect(() => {
    settingsService.get().then((res) => setWaNumber(res.data.whatsapp_number)).catch(() => {})
  }, [])

  const buildWhatsAppMessage = () => {
    let msg = `Hi! I'd like to order:\n\n`
    items.forEach((item) => {
      const price = item.discountPrice ?? item.price
      msg += `*${item.name}*\nSize: ${item.size} | Color: ${item.color} | Qty: ${item.quantity} | ₹${(price * item.quantity).toLocaleString('en-IN')}\n\n`
    })
    msg += `*Total: ₹${subtotal.toLocaleString('en-IN')}*\n\nPlease confirm my order.`
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <FiShoppingBag size={64} />
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn btn-primary btn-lg">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="container">
        <div className={styles.header}>
          <Link to="/shop" className={styles.backLink}>
            <FiArrowLeft size={18} /> Continue Shopping
          </Link>
          <h1 className={styles.title}>Your Cart <span>({itemCount} items)</span></h1>
        </div>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.items}>
            {items.map((item) => {
              const price = item.discountPrice ?? item.price
              const itemTotal = price * item.quantity
              return (
                <div key={item.key} className={styles.item}>
                  <div className={styles.itemImg}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.name} />
                    ) : (
                      <div className={styles.noImg}><FiShoppingBag size={24} /></div>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.itemMeta}>
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>Color: <strong>{item.color}</strong></span>
                    </div>
                    <div className={styles.itemPriceRow}>
                      <span className={styles.itemPrice}>₹{price.toLocaleString('en-IN')}</span>
                      {item.discountPrice && (
                        <span className={styles.itemOriginal}>₹{item.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={styles.qtyBtn}
                      >
                        <FiMinus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className={styles.qtyBtn}
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                    <span className={styles.itemTotal}>₹{itemTotal.toLocaleString('en-IN')}</span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.key)}
                      aria-label="Remove"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{originalTotal.toLocaleString('en-IN')}</span>
              </div>
              {savings > 0 && (
                <div className={`${styles.summaryRow} ${styles.savings}`}>
                  <span>Discount</span>
                  <span>-₹{savings.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span className={styles.free}>Free</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {savings > 0 && (
              <div className={styles.savingsBanner}>
                🎉 You're saving ₹{savings.toLocaleString('en-IN')} on this order!
              </div>
            )}
            <Link to="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
              Proceed to Checkout
            </Link>
            <a
              href={buildWhatsAppMessage()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waBtn}
            >
              <FaWhatsapp size={20} />
              Order via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
