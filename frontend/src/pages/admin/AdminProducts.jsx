import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService, categoryService } from '../../services/api'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './AdminProducts.module.css'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    productService.adminList({ search, category: catFilter })
      .then((r) => setProducts(r.data || []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { categoryService.getAll().then((r) => setCategories(r.data || [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [search, catFilter])

  const handleDelete = async (id) => {
    try {
      await productService.delete(id)
      toast.success('Product deleted')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const getThumbSrc = (p) => {
    const raw = p.thumbnail_url || p.thumbnail
    if (!raw) return null
    if (typeof raw !== 'string') return null
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    if (raw.startsWith('/media/')) return raw
    if (raw.startsWith('media/')) return `/${raw}`
    return `/media/${raw}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Products</h1>
          <p>{products.length} products</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm">
          <FiPlus size={16} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={styles.select}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Sizes</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.empty}>No products found</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.thumbCell}>
                        {getThumbSrc(p) ? (
                          <img src={getThumbSrc(p)} alt={p.name} />
                        ) : (
                          <div className={styles.noThumb}>No img</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productSub}>{p.sub_category || ''}</div>
                    </td>
                    <td>{p.category_name || '—'}</td>
                    <td>₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                    <td>
                      {p.discount_price
                        ? <span className={styles.discountPrice}>₹{parseFloat(p.discount_price).toLocaleString('en-IN')}</span>
                        : '—'}
                    </td>
                    <td>
                      <div className={styles.tags}>
                        {p.sizes?.map((s) => (
                          <span key={s.id} className={styles.tag}>{s.size}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className={styles.tags}>
                        {p.is_new_arrival && <span className={`${styles.tag} ${styles.tagNew}`}>New</span>}
                        {p.is_trending && <span className={`${styles.tag} ${styles.tagHot}`}>Trending</span>}
                        {p.is_featured && <span className={`${styles.tag} ${styles.tagFeat}`}>Featured</span>}
                        {p.is_best_seller && <span className={`${styles.tag} ${styles.tagBest}`}>Best Seller</span>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link to={`/admin/products/${p.id}/edit`} className={styles.editBtn} title="Edit">
                          <FiEdit2 size={14} />
                        </Link>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteId(p.id)}
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className={styles.modal}>
          <div className={styles.modalCard}>
            <h3>Delete Product?</h3>
            <p>This action cannot be undone. The product will be permanently removed.</p>
            <div className={styles.modalBtns}>
              <button className="btn btn-outline btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className={`btn btn-sm ${styles.confirmDelete}`} onClick={() => handleDelete(deleteId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
