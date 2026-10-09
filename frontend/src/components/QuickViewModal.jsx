import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { FiX, FiShoppingBag, FiCheck, FiStar, FiTruck, FiShield, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './QuickViewModal.module.css'

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0]?.size || '')
      setSelectedColor(product.colors?.[0]?.color || '')
      setActiveImg(0)
      setQuantity(1)
    }
  }, [product])

  if (!isOpen || !product) return null

  const images = product.images && product.images.length > 0
    ? product.images.map((imgObj) => imgObj.image)
    : [product.thumbnail_url || product.thumbnail]

  const displayPrice = product.discount_price
    ? parseFloat(product.discount_price)
    : parseFloat(product.price)
  const originalPrice = parseFloat(product.price)
  const hasDiscount = !!product.discount_price

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }
    if (!selectedColor) {
      toast.error('Please select a color')
      return
    }
    addItem(product, selectedSize, selectedColor, quantity)
    toast.success(`Added ${quantity} x ${product.name} to cart! 🛍️`)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <FiX size={20} />
        </button>

        <div className={styles.layout}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImgWrap}>
              <img src={images[activeImg]} alt={product.name} className={styles.mainImg} />
              {hasDiscount && (
                <span className={styles.discountBadge}>-{product.discount_percentage}% OFF</span>
              )}
            </div>

            {images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className={styles.details}>
            <span className={styles.category}>{product.category_name || 'Streetwear'}</span>
            <h2 className={styles.title}>{product.name}</h2>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} size={14} fill="#c8a96e" color="#c8a96e" />
                ))}
              </div>
              <span className={styles.ratingText}>4.9 (128 reviews)</span>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>₹{displayPrice.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <span className={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
              )}
            </div>

            <p className={styles.description}>
              {product.description || 'Premium heavyweight 240 GSM organic cotton. Relaxed streetwear fit designed for maximum comfort and durability.'}
            </p>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>
                  Select Size: <strong>{selectedSize}</strong>
                </label>
                <div className={styles.sizeGrid}>
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`${styles.sizeBtn} ${selectedSize === s.size ? styles.sizeBtnActive : ''}`}
                      onClick={() => setSelectedSize(s.size)}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>
                  Select Color: <strong>{selectedColor}</strong>
                </label>
                <div className={styles.colorGrid}>
                  {product.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.colorBtn} ${selectedColor === c.color ? styles.colorBtnActive : ''}`}
                      onClick={() => setSelectedColor(c.color)}
                      title={c.color}
                    >
                      <span className={styles.colorDot} style={{ background: c.color_hex || '#000' }} />
                      <span>{c.color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and CTA */}
            <div className={styles.actionRow}>
              <div className={styles.qtyBox}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleAddToCart}>
                <FiShoppingBag size={18} /> Add To Cart
              </button>
            </div>

            <div className={styles.footerNote}>
              <div><FiTruck size={14} color="#10b981" /> Free Express Shipping</div>
              <div><FiShield size={14} color="#c8a96e" /> 100% Authentic Quality</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
