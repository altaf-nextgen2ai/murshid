import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService, settingsService } from '../services/api'
import ProductCard from '../components/ProductCard'
import { FaWhatsapp } from 'react-icons/fa'
import { FiArrowRight, FiStar, FiTruck, FiRefreshCw, FiShield } from 'react-icons/fi'
import styles from './Home.module.css'

// ─── Hero images & Categories (Real Product Images) ─────────────────────────
const heroImages = [
  '/media/products/thumbnails/t-shirt7.jpeg',
  '/media/products/thumbnails/t-shirt3.jpeg',
  '/media/products/thumbnails/t-shirt1.jpeg',
]

const categories = [
  { name: 'Men', img: '/media/products/thumbnails/t-shirt1.jpeg', tag: 'men' },
  { name: 'Women', img: null, tag: 'women', comingSoon: true },
  { name: 'New Arrivals', img: '/media/products/thumbnails/t-shirt7.jpeg', tag: 'new' },
]

const reviews = [
  { name: 'Arjun S.', rating: 5, text: 'Absolutely love the quality. The fabric is premium and the fit is perfect. Will definitely buy more!', city: 'Mumbai' },
  { name: 'Priya K.', rating: 5, text: 'Finally a brand that understands Gen-Z fashion. The designs are fire and delivery was super fast.', city: 'Bangalore' },
  { name: 'Rahul M.', rating: 5, text: 'Ordered 3 tees and each one exceeded my expectations. The WhatsApp ordering made it so easy!', city: 'Delhi' },
  { name: 'Sneha R.', rating: 4, text: 'Great quality at this price point. The colors are vibrant and washing hasn\'t faded them at all.', city: 'Pune' },
]

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [newArrivals, setNewArrivals] = useState([])
  const [trending, setTrending] = useState([])
  const [featured, setFeatured] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [waNumber, setWaNumber] = useState('917042129273')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    Promise.all([
      productService.getAll({ is_new_arrival: 'true' }),
      productService.getAll({ is_trending: 'true' }),
      productService.getAll({ is_featured: 'true' }),
      productService.getAll({ is_best_seller: 'true' }),
      settingsService.get(),
    ]).then(([na, tr, ft, bs, settings]) => {
      setNewArrivals(na.data || [])
      setTrending(tr.data || [])
      setFeatured(ft.data || [])
      setBestSellers(bs.data || [])
      setWaNumber(settings.data.whatsapp_number || '917042129273')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.home}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          {heroImages.map((img, i) => (
            <div key={img} className={`${styles.heroSlide} ${i === heroIdx ? styles.active : ''}`}>
              <img src={img} alt="" className={styles.heroImg} />
            </div>
          ))}
          <div className={styles.heroOverlay} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <p className={styles.heroLabel}>NEW SEASON 2026</p>
          <h1 className={styles.heroTitle}>
            New Season.<br />
            <span className={styles.heroTitleGold}>New Style.</span>
          </h1>
          <p className={styles.heroSub}>
            Premium streetwear crafted for the bold generation.
            <br />Limited drops. Unlimited style.
          </p>
          <div className={styles.heroBtns}>
            <Link to="/shop" className="btn btn-white btn-lg">
              Shop Now
            </Link>
            <Link to="/shop?is_new_arrival=true" className={`btn ${styles.btnOutlineWhite} btn-lg`}>
              Explore Collection
            </Link>
          </div>
        </div>
        {/* Slide indicators */}
        <div className={styles.heroIndicators}>
          {heroImages.map((_, i) => (
            <button
              key={i}
              className={`${styles.indicator} ${i === heroIdx ? styles.indicatorActive : ''}`}
              onClick={() => setHeroIdx(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────────────────── */}
      <div className={styles.marquee}>
        <div className="marquee-track">
          {[...Array(8)].map((_, i) => (
            <span key={i} className={styles.marqueeItem}>
              NEW COLLECTION &nbsp;✦&nbsp; PREMIUM QUALITY &nbsp;✦&nbsp; FAST DELIVERY &nbsp;✦&nbsp; WHATSAPP ORDERS &nbsp;✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {[
              { icon: FiTruck, title: 'Fast Delivery', sub: 'Pan India shipping' },
              { icon: FiRefreshCw, title: 'Easy Returns', sub: '7-day return policy' },
              { icon: FiShield, title: 'Premium Quality', sub: '100% authentic products' },
              { icon: FaWhatsapp, title: 'WhatsApp Support', sub: 'Instant assistance' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className={styles.feature}>
                <div className={styles.featureIcon}><Icon size={22} /></div>
                <div>
                  <h4>{title}</h4>
                  <p>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="container">
          <div className="section-header">
            <p className="section-label">Browse By</p>
            <h2 className="section-title">Shop by Category</h2>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.comingSoon ? '#' : (cat.tag === 'new' ? '/shop?is_new_arrival=true' : `/shop/category/${cat.name}`)}
                className={`${styles.categoryCard} ${cat.comingSoon ? styles.comingSoonCard : ''}`}
                onClick={(e) => { if (cat.comingSoon) e.preventDefault(); }}
              >
                {cat.img ? (
                  <img src={cat.img} alt={cat.name} className={styles.categoryImg} />
                ) : (
                  <div className={styles.comingSoonBg}>
                    <span className={styles.comingSoonBadge}>Coming Soon</span>
                  </div>
                )}
                <div className={styles.categoryOverlay} />
                <div className={styles.categoryInfo}>
                  <h3>{cat.name}</h3>
                  {cat.comingSoon ? (
                    <span className={styles.comingSoonTag}>Collection Coming Soon</span>
                  ) : (
                    <span className={styles.categoryLink}>Shop Now <FiArrowRight size={14} /></span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ─────────────────────────────────────────────────────── */}
      {(loading || newArrivals.length > 0) && (
        <section className="section-pad" style={{ background: 'var(--gray-100)' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-label">Just In</p>
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">The freshest drops of the season, curated just for you.</p>
            </div>
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="product-grid">
                {newArrivals.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link to="/shop?is_new_arrival=true" className="btn btn-primary">
                View All New Arrivals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Editorial Banner ─────────────────────────────────────────── */}
      <section className={styles.editorial}>
        <div className={styles.editorialLeft}>
          <img src="/media/products/thumbnails/t-shirt3.jpeg" alt="Featured Collection" className={styles.editorialImg} />
        </div>
        <div className={styles.editorialRight}>
          <p className="section-label">Featured Collection</p>
          <h2 className={styles.editorialTitle}>
            Dressed for<br />
            <em>Every Season</em>
          </h2>
          <p className={styles.editorialText}>
            From oversized streetwear to clean essentials — our premium collection
            is designed to carry you through every occasion with confidence.
          </p>
          <Link to="/shop?is_featured=true" className="btn btn-primary">
            Shop Collection <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────────────────── */}
      {(loading || trending.length > 0) && (
        <section className="section-pad">
          <div className="container">
            <div className="section-header">
              <p className="section-label">What's Hot</p>
              <h2 className="section-title">Trending Now</h2>
            </div>
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              <div className="product-grid">
                {trending.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link to="/shop?is_trending=true" className="btn btn-outline">
                See All Trending
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Best Sellers ─────────────────────────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="section-pad" style={{ background: 'var(--gray-100)' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-label">Fan Favorites</p>
              <h2 className="section-title">Best Sellers</h2>
            </div>
            <div className="product-grid">
              {bestSellers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      <section className="section-pad">
        <div className="container">
          <div className="section-header">
            <p className="section-label">Testimonials</p>
            <h2 className="section-title">What Customers Say</h2>
          </div>
          <div className={styles.reviewsGrid}>
            {reviews.map((r) => (
              <div key={r.name} className={styles.reviewCard}>
                <div className={styles.reviewStars}>
                  {[...Array(r.rating)].map((_, i) => (
                    <FiStar key={i} size={14} fill="#c8a96e" color="#c8a96e" />
                  ))}
                </div>
                <p className={styles.reviewText}>"{r.text}"</p>
                <div className={styles.reviewer}>
                  <div className={styles.reviewerAvatar}>{r.name[0]}</div>
                  <div>
                    <strong>{r.name}</strong>
                    <span>{r.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp CTA ─────────────────────────────────────────────────────── */}
      <section className={styles.waCta}>
        <div className="container">
          <div className={styles.waCtaInner}>
            <div className={styles.waCtaIcon}><FaWhatsapp size={48} /></div>
            <div>
              <h2 className={styles.waCtaTitle}>Order via WhatsApp</h2>
              <p className={styles.waCtaSub}>
                Drop us a message and our team will assist you with your order instantly.
              </p>
            </div>
            <a
              href={`https://wa.me/${waNumber}?text=Hi! I want to place an order.`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waCtaBtn}
            >
              <FaWhatsapp size={20} /> Start Chat
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}

function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="product-grid">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 12 }} />
          <div style={{ padding: '14px 0' }}>
            <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
