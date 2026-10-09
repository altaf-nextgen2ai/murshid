import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productService, settingsService } from '../services/api'
import ProductCard from '../components/ProductCard'
import AnimatedCountUp from '../components/AnimatedCountUp'
import { FaWhatsapp } from 'react-icons/fa'
import {
  FiArrowRight, FiStar, FiTruck, FiRefreshCw, FiShield,
  FiAward, FiTrendingUp, FiShoppingBag, FiMail, FiCheck, FiHeadphones
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './Home.module.css'

const heroSlides = [
  {
    img: '/media/products/thumbnails/t-shirt3.jpeg',
    label: 'LIMITED EDITION',
    titleLine1: 'Modern',
    titleLine2: 'Minimal',
    titleLine3: 'Essentials',
    titleGold: 'Elevated.',
    sub: 'Crafted with premium dropped shoulders, stone-washed finishes, and durable precision stitching.',
    btnText: 'EXPLORE TRENDING',
    link: '/shop?is_trending=true'
  },
  {
    img: '/media/products/thumbnails/t-shirt7.jpeg',
    label: 'SUMMER DROP 2026',
    titleLine1: 'Streetwear',
    titleLine2: 'Redefined',
    titleLine3: 'Aesthetics',
    titleGold: 'Unmatched.',
    sub: 'Heavyweight organic cotton tees engineered for extreme comfort and oversized silhouettes.',
    btnText: 'SHOP NEW DROP',
    link: '/shop?is_new_arrival=true'
  },
  {
    img: '/media/products/thumbnails/t-shirt1.jpeg',
    label: 'FAN FAVORITES',
    titleLine1: 'Everyday',
    titleLine2: 'Luxury',
    titleLine3: 'Staples',
    titleGold: 'Refined.',
    sub: 'Join thousands of fashion lovers across India wearing Murshid premium everyday fits.',
    btnText: 'SHOP BEST SELLERS',
    link: '/shop?is_best_seller=true'
  }
]

const categories = [
  { name: 'T-Shirts', img: '/media/products/thumbnails/t-shirt1.jpeg', tag: 'T-Shirt' },
  { name: 'Hoodies', img: '/media/products/thumbnails/t-shirt3.jpeg', tag: 'Hoodie' },
  { name: 'Shirts', img: '/media/products/thumbnails/t-shirt7.jpeg', tag: 'Shirt' },
  { name: 'Pants', img: '/media/products/thumbnails/t-shirt8.jpeg', tag: 'Pant' },
]

const reviews = [
  { name: 'Arjun Sharma', rating: 5, text: 'Absolutely love the quality. The fabric is 240 GSM heavy cotton and the fit is top notch. Will definitely buy more!', city: 'Mumbai', date: 'Verified Buyer' },
  { name: 'Priya Kapoor', rating: 5, text: 'Finally a brand that understands Gen-Z fashion. The graphic print is fire and delivery was super fast.', city: 'Bangalore', date: 'Verified Buyer' },
  { name: 'Rahul Mehta', rating: 5, text: 'Ordered 3 tees and each one exceeded my expectations. The WhatsApp ordering made it so smooth!', city: 'Delhi', date: 'Verified Buyer' },
  { name: 'Sneha Rao', rating: 5, text: 'Great quality at this price point. The colors are vibrant and washing hasn\'t faded them at all.', city: 'Pune', date: 'Verified Buyer' },
]

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [activeTab, setActiveTab] = useState('new')
  const [newArrivals, setNewArrivals] = useState([])
  const [trending, setTrending] = useState([])
  const [featured, setFeatured] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [waNumber, setWaNumber] = useState('917042129273')
  const [loading, setLoading] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroSlides.length)
    }, 6000)
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

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setSubscribed(true)
    toast.success('Thank you for subscribing to TAMMO VIP Club! 🌟')
    setNewsletterEmail('')
  }

  const getDisplayedProducts = () => {
    switch (activeTab) {
      case 'trending': return trending.length ? trending : newArrivals
      case 'featured': return featured.length ? featured : newArrivals
      case 'bestsellers': return bestSellers.length ? bestSellers : newArrivals
      default: return newArrivals
    }
  }

  return (
    <div className={styles.home}>

      {/* ── Dynamic Luxury Hero Slider ────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          {heroSlides.map((slide, i) => (
            <div key={i} className={`${styles.heroSlide} ${i === heroIdx ? styles.active : ''}`}>
              <img src={slide.img} alt={slide.titleLine1} className={styles.heroImg} />
            </div>
          ))}
          <div className={styles.heroOverlay} />
        </div>

        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            <FiAward size={13} color="#c8a96e" />
            <span>{heroSlides[heroIdx].label}</span>
          </div>

          <h1 className={styles.heroTitle}>
            {heroSlides[heroIdx].titleLine1}<br />
            {heroSlides[heroIdx].titleLine2}<br />
            {heroSlides[heroIdx].titleLine3}<br />
            <span className={styles.heroTitleGold}>
              {heroSlides[heroIdx].titleGold}
            </span>
          </h1>

          <p className={styles.heroSub}>{heroSlides[heroIdx].sub}</p>

          <div className={styles.heroBtns}>
            <Link to={heroSlides[heroIdx].link} className="btn btn-gold btn-lg">
              {heroSlides[heroIdx].btnText} <FiArrowRight size={18} />
            </Link>
            <Link to="/shop" className={`btn ${styles.btnOutlineWhite} btn-lg`}>
              EXPLORE FULL SHOP
            </Link>
          </div>

          {/* Desktop Floating Stats Bar */}
          <div className={styles.heroFloatingStats}>
            <div className={styles.statCard}>
              <strong>
                <AnimatedCountUp end={10000} suffix="+" duration={2500} />
              </strong>
              <span>Happy Customers</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statCard}>
              <strong>
                <AnimatedCountUp end={100} suffix="%" duration={2000} />
              </strong>
              <span>Organic Heavy Cotton</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statCard}>
              <strong>
                <AnimatedCountUp end={4.9} decimals={1} suffix=" ★" duration={2200} />
              </strong>
              <span>Customer Rating</span>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className={styles.heroIndicators}>
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`${styles.indicator} ${i === heroIdx ? styles.indicatorActive : ''}`}
              onClick={() => setHeroIdx(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Desktop Marquee Announcement Ticker ────────────────────────────────── */}
      <div className={styles.marquee}>
        <div className="marquee-track">
          {[...Array(6)].map((_, i) => (
            <span key={i} className={styles.marqueeItem}>
              🔥 FREE SHIPPING ON ALL ORDERS &nbsp;✦&nbsp; 100% PREMIUM COTTON &nbsp;✦&nbsp; INSTANT WHATSAPP ORDERING &nbsp;✦&nbsp; EASY 7-DAY RETURNS &nbsp;✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Dark Trust Features Bar ───────────────────────────────────────────── */}
      <section className={styles.featuresDarkBar}>
        <div className="container">
          <div className={styles.featuresDarkGrid}>
            <div className={styles.featureDarkItem}>
              <FiTruck size={24} className={styles.featureDarkIcon} />
              <div>
                <h4>FREE SHIPPING</h4>
                <p>On All Orders</p>
              </div>
            </div>
            <div className={styles.featureDarkDivider} />
            <div className={styles.featureDarkItem}>
              <FiRefreshCw size={24} className={styles.featureDarkIcon} />
              <div>
                <h4>EASY RETURNS</h4>
                <p>7-Day Policy</p>
              </div>
            </div>
            <div className={styles.featureDarkDivider} />
            <div className={styles.featureDarkItem}>
              <FiShield size={24} className={styles.featureDarkIcon} />
              <div>
                <h4>PREMIUM QUALITY</h4>
                <p>Best Materials</p>
              </div>
            </div>
            <div className={styles.featureDarkDivider} />
            <div className={styles.featureDarkItem}>
              <FiHeadphones size={24} className={styles.featureDarkIcon} />
              <div>
                <h4>24/7 SUPPORT</h4>
                <p>We're Here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop By Category Section ──────────────────────────────────────────── */}
      <section className={styles.categorySection}>
        <div className="container">
          <div className={styles.categoryHeader}>
            <h2 className={styles.categorySectionTitle}>Shop By Category</h2>
            <Link to="/shop" className={styles.viewAllBtn}>
              View All <FiArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.categoryGrid4}>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/shop?search=${encodeURIComponent(cat.name)}`}
                className={styles.categoryCard4}
              >
                <img src={cat.img} alt={cat.name} className={styles.categoryImg4} />
                <div className={styles.categoryOverlay4} />
                <div className={styles.categoryPillBox}>
                  <span className={styles.categoryPillText}>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Tabbed Product Showcase ───────────────────────────────── */}
      <section className="section-pad" style={{ background: '#08080a' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 32 }}>
            <p className="section-label" style={{ color: '#c8a96e' }}>EXPLORE TRENDING FASHION</p>
            <h2 className="section-title" style={{ color: '#ffffff' }}>Featured Drops</h2>
            
            {/* Tabs */}
            <div className={styles.tabList}>
              {[
                { id: 'new', label: 'New Arrivals' },
                { id: 'trending', label: 'Trending Now' },
                { id: 'featured', label: 'Featured Fits' },
                { id: 'bestsellers', label: 'Best Sellers' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="product-grid">
              {getDisplayedProducts().slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Link to="/shop" className="btn btn-gold btn-lg">
              View All Products <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Luxury Editorial Banner ─────────────────────────────────────────── */}
      <section className={styles.editorial}>
        <div className={styles.editorialLeft}>
          <img src="/media/products/thumbnails/t-shirt3.jpeg" alt="Featured Collection" className={styles.editorialImg} />
          <div className={styles.editorialGlow} />
        </div>
        <div className={styles.editorialRight}>
          <div className={styles.editorialBadge}>
            <FiTrendingUp size={14} /> EXCLUSIVE FASHION
          </div>
          <h2 className={styles.editorialTitle}>
            Designed for<br />
            <em>Unmatched Style</em>
          </h2>
          <p className={styles.editorialText}>
            From oversized streetwear tees to minimal essential wardrobe staples —
            our pieces combine 240 GSM organic cotton with contemporary relaxed silhouettes.
          </p>
          <div className={styles.editorialHighlights}>
            <div className={styles.highlightItem}><FiCheck color="#c8a96e" /> Pre-shrunk Fabric</div>
            <div className={styles.highlightItem}><FiCheck color="#c8a96e" /> Double-stitched Collar</div>
            <div className={styles.highlightItem}><FiCheck color="#c8a96e" /> Bio-washed Softness</div>
          </div>
          <Link to="/shop?is_featured=true" className="btn btn-gold btn-lg">
            Shop Premium Drop <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Customer Reviews Section ─────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#0d0d10' }}>
        <div className="container">
          <div className="section-header">
            <p className="section-label" style={{ color: '#c8a96e' }}>REAL FEEDBACK</p>
            <h2 className="section-title" style={{ color: '#ffffff' }}>Loved By 10,000+ Customers</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>See why fashion enthusiasts trust TAMMO for their daily fits.</p>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.map((r, i) => (
              <div key={i} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewStars}>
                    {[...Array(r.rating)].map((_, idx) => (
                      <FiStar key={idx} size={15} fill="#c8a96e" color="#c8a96e" />
                    ))}
                  </div>
                  <span className={styles.verifiedTag}>{r.date}</span>
                </div>
                <p className={styles.reviewText}>"{r.text}"</p>
                <div className={styles.reviewer}>
                  <div className={styles.reviewerAvatar}>{r.name[0]}</div>
                  <div>
                    <strong style={{ color: '#ffffff' }}>{r.name}</strong>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.city}, India</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIP Newsletter Section ───────────────────────────────────────────── */}
      <section className={styles.newsletterSection}>
        <div className="container">
          <div className={styles.newsletterCard}>
            <div className={styles.newsIcon}>
              <FiMail size={32} />
            </div>
            <h2>Join the TAMMO VIP Club</h2>
            <p>Get early access to exclusive drops, secret discount codes & streetwear updates.</p>

            {subscribed ? (
              <div className={styles.subscribedMsg}>
                <FiCheck size={20} color="#10b981" />
                <span>You are subscribed! Watch your inbox for VIP drops.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className={styles.newsletterForm}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className={styles.newsInput}
                />
                <button type="submit" className="btn btn-gold">
                  Subscribe Now
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── WhatsApp CTA Banner ─────────────────────────────────────────────── */}
      <section className={styles.waCta}>
        <div className="container">
          <div className={styles.waCtaInner}>
            <div className={styles.waCtaIcon}><FaWhatsapp size={48} /></div>
            <div>
              <h2 className={styles.waCtaTitle}>Need Order Support on WhatsApp?</h2>
              <p className={styles.waCtaSub}>
                Have custom size queries or want instant order assistance? Chat with us directly.
              </p>
            </div>
            <a
              href={`https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent("Hi! I'd like to ask a query about TAMMO products.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waCtaBtn}
            >
              <FaWhatsapp size={22} /> Chat on WhatsApp
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
          <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 16 }} />
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
