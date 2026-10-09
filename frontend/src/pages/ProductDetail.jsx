import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { productService, settingsService } from '../services/api'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import { FiShoppingBag, FiMinus, FiPlus, FiChevronRight } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import styles from './ProductDetail.module.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [waNumber, setWaNumber] = useState('917042129273')
  const [imgZoom, setImgZoom] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setLoading(true)
    setActiveImg(0)
    setSelectedSize(null)
    setSelectedColor(null)
    setQuantity(1)

    Promise.all([
      productService.getById(id),
      productService.getRelated(id),
      settingsService.get(),
    ]).then(([prod, rel, settings]) => {
      setProduct(prod.data)
      setRelated(rel.data || [])
      setWaNumber(settings.data.whatsapp_number || '917042129273')
    }).catch(() => {
      toast.error('Product not found')
      navigate('/shop')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <ProductDetailSkeleton />

  if (!product) return null

  const formatImageUrl = (url) => {
    if (!url) return null
    if (typeof url !== 'string') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('/media/')) return url
    if (url.startsWith('media/')) return `/${url}`
    return `/media/${url}`
  }

  const allImages = [
    ...(product.thumbnail_url || product.thumbnail ? [{ image: formatImageUrl(product.thumbnail_url || product.thumbnail) }] : []),
    ...(product.images || []).map((img) => ({
      image: formatImageUrl(img.image_url || img.image),
    })),
  ]

  const displayImages = allImages.length > 0
    ? allImages
    : [{ image: null }]

  const price = parseFloat(product.price)
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null
  const displayPrice = discountPrice ?? price
  const hasDiscount = !!discountPrice
  const discount = product.discount_percentage

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error('Please select a size'); return }
    if (!selectedColor) { toast.error('Please select a color'); return }
    addItem(product, selectedSize, selectedColor, quantity)
  }

  const buildWhatsAppMessage = () => {
    const size = selectedSize || 'Not selected'
    const color = selectedColor || 'Not selected'
    const msg = `Hi! I'd like to order this product:\n\n*${product.name}*\nSize: ${size}\nColor: ${color}\nQuantity: ${quantity}\nPrice: ₹${(displayPrice * quantity).toLocaleString('en-IN')}\n\nPlease confirm availability.`
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`
  }

  const handleZoom = (e) => {
    if (window.innerWidth < 768) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  return (
    <div className={`${styles.page} page-enter`}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <FiChevronRight size={14} />
          <Link to="/shop">Shop</Link>
          <FiChevronRight size={14} />
          {product.category_name && (
            <>
              <Link to={`/shop/category/${product.category_name}`}>{product.category_name}</Link>
              <FiChevronRight size={14} />
            </>
          )}
          <span>{product.name}</span>
        </nav>

        {/* Main content */}
        <div className={styles.layout}>
          {/* Gallery */}
          <div className={styles.gallery}>
            <div className={styles.thumbnails}>
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImg(i)}
                >
                  {img.image ? (
                    <img src={img.image} alt="" />
                  ) : (
                    <div className={styles.noImg}><FiShoppingBag size={16} /></div>
                  )}
                </button>
              ))}
            </div>
            <div
              className={`${styles.mainImg} ${imgZoom ? styles.zoomed : ''}`}
              onMouseMove={handleZoom}
              onMouseEnter={() => setImgZoom(true)}
              onMouseLeave={() => setImgZoom(false)}
            >
              {displayImages[activeImg]?.image ? (
                <img
                  src={displayImages[activeImg].image}
                  alt={product.name}
                  style={imgZoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                />
              ) : (
                <div className={styles.noImgLarge}><FiShoppingBag size={48} /></div>
              )}
              {hasDiscount && (
                <span className={`badge badge-red ${styles.discountBadge}`}>-{discount}%</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className={styles.info}>
            {product.is_new_arrival && (
              <span className="badge badge-black" style={{ marginBottom: 12, display: 'inline-block' }}>New Arrival</span>
            )}
            <h1 className={styles.name}>{product.name}</h1>
            {product.category_name && (
              <Link to={`/shop/category/${product.category_name}`} className={styles.categoryTag}>
                {product.category_name}
              </Link>
            )}

            {/* Price */}
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>₹{displayPrice.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <>
                  <span className={styles.originalPrice}>₹{price.toLocaleString('en-IN')}</span>
                  <span className={styles.savingBadge}>Save {discount}%</span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className={styles.savingsText}>
                You save ₹{(price - displayPrice).toLocaleString('en-IN')}
              </p>
            )}

            <div className="divider" />

            {/* Size selector */}
            <div className={styles.selector}>
              <div className={styles.selectorHeader}>
                <span className={styles.selectorLabel}>Size</span>
                {selectedSize && <span className={styles.selectedVal}>{selectedSize}</span>}
              </div>
              <div className={styles.sizeBtns}>
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    className={`${styles.sizeBtn} ${selectedSize === s.size ? styles.sizeBtnActive : ''}`}
                    onClick={() => setSelectedSize(s.size)}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector */}
            <div className={styles.selector}>
              <div className={styles.selectorHeader}>
                <span className={styles.selectorLabel}>Color</span>
                {selectedColor && <span className={styles.selectedVal}>{selectedColor}</span>}
              </div>
              <div className={styles.colorBtns}>
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.colorBtn} ${selectedColor === c.color ? styles.colorBtnActive : ''}`}
                    style={{ '--color-hex': c.color_hex || '#ccc' }}
                    onClick={() => setSelectedColor(c.color)}
                    title={c.color}
                  >
                    <span
                      className={styles.colorSwatch}
                      style={{ background: c.color_hex || '#ccc' }}
                    />
                    <span>{c.color}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className={styles.selector}>
              <span className={styles.selectorLabel}>Quantity</span>
              <div className={styles.quantityRow}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <FiMinus size={16} />
                </button>
                <span className={styles.qtyVal}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <FiPlus size={16} />
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className={styles.ctaBtns}>
              <button className={`btn btn-primary ${styles.addBtn}`} onClick={handleAddToCart}>
                <FiShoppingBag size={18} />
                Add to Cart
              </button>
              <a
                href={buildWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waBtn}
              >
                <FaWhatsapp size={20} />
                Order on WhatsApp
              </a>
            </div>

            {/* Total */}
            {(selectedSize && selectedColor) && (
              <div className={styles.totalRow}>
                <span>Total:</span>
                <strong>₹{(displayPrice * quantity).toLocaleString('en-IN')}</strong>
              </div>
            )}

            <div className="divider" />

            {/* Description */}
            {product.description && (
              <div className={styles.description}>
                <h3>Product Details</h3>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section style={{ marginTop: 64 }}>
            <div className="section-header" style={{ textAlign: 'left' }}>
              <p className="section-label">You May Also Like</p>
              <h2 className="section-title" style={{ fontSize: 28 }}>Related Products</h2>
            </div>
            <div className="product-grid" style={{ marginTop: 24 }}>
              {related.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 24 }}>
          <div className="skeleton" style={{ height: 16, width: '30%' }} />
          <div className="skeleton" style={{ height: 36, width: '80%' }} />
          <div className="skeleton" style={{ height: 28, width: '40%' }} />
          <div className="skeleton" style={{ height: 1 }} />
          <div className="skeleton" style={{ height: 14, width: '20%' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ width: 48, height: 48, borderRadius: 8 }} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
