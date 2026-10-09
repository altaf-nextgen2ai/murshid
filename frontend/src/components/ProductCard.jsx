import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import QuickViewModal from './QuickViewModal'
import styles from './ProductCard.module.css'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [wishlist, setWishlist] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const formatImageUrl = (url) => {
    if (!url) return null
    if (typeof url !== 'string') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/media/')) return url
    if (url.startsWith('media/')) return `/${url}`
    return `/media/${url}`
  }

  const rawUrl = product.thumbnail_url || product.thumbnail
  const imageUrl = formatImageUrl(rawUrl)
  const displayPrice = product.discount_price
    ? parseFloat(product.discount_price)
    : parseFloat(product.price)
  const originalPrice = parseFloat(product.price)
  const hasDiscount = !!product.discount_price
  const discount = product.discount_percentage

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const firstSize = product.sizes?.[0]?.size
    const firstColor = product.colors?.[0]?.color
    if (firstSize && firstColor) {
      addItem(product, firstSize, firstColor, 1)
    } else {
      setIsQuickViewOpen(true)
    }
  }

  const handleOpenQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsQuickViewOpen(true)
  }

  return (
    <>
      <Link to={`/product/${product.id}`} className={styles.card}>
        {/* Image container */}
        <div className={styles.imageWrap}>
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className={styles.image}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={styles.placeholder}>
              <FiShoppingBag size={32} />
            </div>
          )}

          {/* Badges */}
          <div className={styles.badges}>
            {product.is_new_arrival && <span className={`badge badge-black ${styles.badge}`}>New</span>}
            {hasDiscount && <span className={`badge badge-red ${styles.badge}`}>-{discount}%</span>}
            {product.is_trending && !hasDiscount && !product.is_new_arrival && (
              <span className={`badge badge-gold ${styles.badge}`}>Hot</span>
            )}
          </div>

          {/* Wishlist */}
          <button
            className={`${styles.wishlistBtn} ${wishlist ? styles.wished : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWishlist(!wishlist) }}
            aria-label="Add to wishlist"
          >
            <FiHeart size={16} fill={wishlist ? 'currentColor' : 'none'} />
          </button>

          {/* Hover actions */}
          <div className={styles.hoverActions}>
            <button
              className={styles.hoverBtn}
              onClick={handleOpenQuickView}
              title="Quick preview product"
            >
              <FiEye size={16} /> Quick View
            </button>
            <button
              className={`${styles.hoverBtn} ${styles.hoverBtnPrimary}`}
              onClick={handleQuickAdd}
              title="Quick add to cart"
            >
              <FiShoppingBag size={16} /> Add
            </button>
          </div>

          {/* Color dots */}
          {product.colors && product.colors.length > 0 && (
            <div className={styles.colorDots}>
              {product.colors.slice(0, 5).map((c) => (
                <span
                  key={c.id}
                  className={styles.colorDot}
                  style={{ background: c.color_hex || '#ccc' }}
                  title={c.color}
                />
              ))}
              {product.colors.length > 5 && (
                <span className={styles.colorMore}>+{product.colors.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <p className={styles.category}>{product.category_name}</p>
          <h3 className={styles.name}>{product.name}</h3>

          <div className={styles.priceRow}>
            <span className={`price-current ${styles.price}`}>
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="price-original">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className={styles.sizes}>
              {product.sizes.map((s) => (
                <span key={s.id} className={styles.size}>{s.size}</span>
              ))}
            </div>
          )}
        </div>
      </Link>

      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  )
}

