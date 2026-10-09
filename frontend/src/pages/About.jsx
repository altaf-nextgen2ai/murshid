import { Link } from 'react-router-dom'
import styles from './About.module.css'

export default function About() {
  return (
    <div className={`${styles.page} page-enter`}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <img src="/media/products/thumbnails/t-shirt7.jpeg" alt="" className={styles.heroBg} />
        <div className={`container ${styles.heroContent}`}>
          <p className="section-label">Our Story</p>
          <h1 className={styles.heroTitle}>Born From<br /><em>Passion.</em></h1>
        </div>
      </section>

      {/* Story */}
      <section className="section-pad">
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyImg}>
              <img src="/media/products/thumbnails/t-shirt3.jpeg" alt="Murshid Story" />
            </div>
            <div className={styles.storyText}>
              <p className="section-label">Who We Are</p>
              <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 20 }}>
                Premium Fashion for the Bold Generation
              </h2>
              <p>
                Tammo was founded with a simple belief — that great fashion shouldn't compromise
                on quality or character. We create premium streetwear and essential clothing for
                those who refuse to blend in.
              </p>
              <p>
                Every piece in our collection is thoughtfully designed with attention to fabric,
                fit, and finishing. From oversized silhouettes to clean minimal cuts, we craft
                clothing that moves with you.
              </p>
              <p>
                We're more than a clothing brand — we're a statement for those who wear their
                personality on their sleeve, literally.
              </p>
              <Link to="/shop" className="btn btn-primary" style={{ marginTop: 24 }}>
                Shop the Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={`section-pad ${styles.valuesSection}`}>
        <div className="container">
          <div className="section-header">
            <p className="section-label">What We Stand For</p>
            <h2 className="section-title">Our Values</h2>
          </div>
          <div className={styles.valuesGrid}>
            {[
              { emoji: '✦', title: 'Quality First', desc: 'We never compromise on fabric quality. Every tee is crafted from premium cotton for lasting comfort.' },
              { emoji: '♻', title: 'Responsible Fashion', desc: 'We believe in building pieces that last, reducing waste and choosing quality over quantity.' },
              { emoji: '🎨', title: 'Original Design', desc: 'Each collection is designed in-house, ensuring you wear something truly unique and original.' },
              { emoji: '💬', title: 'Customer Love', desc: 'We\'re always here for you — whether it\'s WhatsApp, email, or a DM. Your satisfaction is our priority.' },
            ].map((v) => (
              <div key={v.title} className={styles.valueCard}>
                <div className={styles.valueEmoji}>{v.emoji}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
