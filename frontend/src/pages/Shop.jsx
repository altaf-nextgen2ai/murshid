import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { productService, categoryService } from '../services/api'
import ProductCard from '../components/ProductCard'
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi'
import styles from './Shop.module.css'

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A–Z' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { categoryName } = useParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || categoryName || ''
  const sort = searchParams.get('sort') || '-created_at'
  const isNew = searchParams.get('is_new_arrival') || ''
  const isTrending = searchParams.get('is_trending') || ''
  const isFeatured = searchParams.get('is_featured') || ''
  const isBestSeller = searchParams.get('is_best_seller') || ''

  useEffect(() => {
    categoryService.getAll()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {
      sort,
      ...(search && { search }),
      ...(category && { category }),
      ...(isNew && { is_new_arrival: isNew }),
      ...(isTrending && { is_trending: isTrending }),
      ...(isFeatured && { is_featured: isFeatured }),
      ...(isBestSeller && { is_best_seller: isBestSeller }),
    }
    productService.getAll(params)
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [search, category, sort, isNew, isTrending, isFeatured, isBestSeller])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasFilters = search || category || isNew || isTrending || isFeatured || isBestSeller

  const pageTitle = categoryName
    ? categoryName
    : isNew === 'true' ? 'New Arrivals'
    : isTrending === 'true' ? 'Trending Now'
    : isFeatured === 'true' ? 'Featured'
    : isBestSeller === 'true' ? 'Best Sellers'
    : search ? `Results for "${search}"`
    : 'All Products'

  return (
    <div className={styles.shop}>
      {/* Header */}
      <div className={styles.shopHeader}>
        <div className="container">
          <nav className={styles.breadcrumb}>
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Shop</span>
            {categoryName && <><span>/</span><span>{categoryName}</span></>}
          </nav>
          <div className={styles.shopHeaderInner}>
            <div>
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
              <p className={styles.productCount}>
                {loading ? 'Loading...' : `${products.length} products`}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.filterToggle}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <FiFilter size={16} />
                Filters
                {hasFilters && <span className={styles.filterDot} />}
              </button>
              <div className={styles.sortWrap}>
                <label className={styles.sortLabel}>Sort:</label>
                <div className={styles.selectWrap}>
                  <select
                    value={sort}
                    onChange={(e) => updateParam('sort', e.target.value)}
                    className={styles.sortSelect}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className={styles.selectIcon} size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar filters */}
          <aside className={`${styles.sidebar} ${filterOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.sidebarHeader}>
              <h3>Filters</h3>
              <button className={styles.closeFilter} onClick={() => setFilterOpen(false)}>
                <FiX size={18} />
              </button>
            </div>

            {hasFilters && (
              <button className={styles.clearBtn} onClick={clearFilters}>
                Clear all filters
              </button>
            )}

            {/* Category filter */}
            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Category</h4>
              <button
                className={`${styles.filterItem} ${!category ? styles.filterActive : ''}`}
                onClick={() => updateParam('category', '')}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.filterItem} ${category === cat.name ? styles.filterActive : ''}`}
                  onClick={() => updateParam('category', category === cat.name ? '' : cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Collection filter */}
            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Collection</h4>
              {[
                { key: 'is_new_arrival', label: 'New Arrivals', val: isNew },
                { key: 'is_trending', label: 'Trending', val: isTrending },
                { key: 'is_featured', label: 'Featured', val: isFeatured },
                { key: 'is_best_seller', label: 'Best Sellers', val: isBestSeller },
              ].map(({ key, label, val }) => (
                <button
                  key={key}
                  className={`${styles.filterItem} ${val === 'true' ? styles.filterActive : ''}`}
                  onClick={() => updateParam(key, val === 'true' ? '' : 'true')}
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>

          {/* Overlay for mobile filters */}
          {filterOpen && (
            <div className={styles.filterOverlay} onClick={() => setFilterOpen(false)} />
          )}

          {/* Products */}
          <main className={styles.products}>
            {/* Active filter chips */}
            {hasFilters && (
              <div className={styles.activeFilters}>
                {search && (
                  <span className={styles.chip}>
                    "{search}" <button onClick={() => updateParam('search', '')}><FiX size={12} /></button>
                  </span>
                )}
                {category && (
                  <span className={styles.chip}>
                    {category} <button onClick={() => updateParam('category', '')}><FiX size={12} /></button>
                  </span>
                )}
                {isNew === 'true' && (
                  <span className={styles.chip}>
                    New Arrivals <button onClick={() => updateParam('is_new_arrival', '')}><FiX size={12} /></button>
                  </span>
                )}
                {isTrending === 'true' && (
                  <span className={styles.chip}>
                    Trending <button onClick={() => updateParam('is_trending', '')}><FiX size={12} /></button>
                  </span>
                )}
                {isFeatured === 'true' && (
                  <span className={styles.chip}>
                    Featured <button onClick={() => updateParam('is_featured', '')}><FiX size={12} /></button>
                  </span>
                )}
                {isBestSeller === 'true' && (
                  <span className={styles.chip}>
                    Best Sellers <button onClick={() => updateParam('is_best_seller', '')}><FiX size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="product-grid">
                {[...Array(8)].map((_, i) => (
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
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                {category?.toLowerCase() === 'women' ? (
                  <>
                    <div className={styles.emptyIcon}>✨</div>
                    <h3>Women's Collection — Coming Soon</h3>
                    <p>We are crafting an exclusive collection for Women. Admin panel se add hote hi yahan live ho jayenge!</p>
                    <button className="btn btn-primary" onClick={clearFilters}>Browse All Products</button>
                  </>
                ) : (
                  <>
                    <div className={styles.emptyIcon}>🛍️</div>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or search query.</p>
                    <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
                  </>
                )}
              </div>
            ) : (
              <div className="product-grid">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
