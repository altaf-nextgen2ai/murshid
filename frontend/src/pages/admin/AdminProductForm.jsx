import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { productService, categoryService } from '../../services/api'
import { FiUpload, FiX, FiArrowLeft, FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './AdminProductForm.module.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLOR_PRESETS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Grey', hex: '#888888' },
  { name: 'Navy', hex: '#001F5B' },
  { name: 'Red', hex: '#E74C3C' },
  { name: 'Blue', hex: '#3498DB' },
  { name: 'Green', hex: '#27AE60' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Beige', hex: '#F5F0E8' },
  { name: 'Olive', hex: '#556B2F' },
  { name: 'Pink', hex: '#FFB6C1' },
  { name: 'Purple', hex: '#9B59B6' },
  { name: 'Orange', hex: '#E67E22' },
  { name: 'Yellow', hex: '#F1C40F' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Dusty Pink', hex: '#D4A5A5' },
  { name: 'Sage', hex: '#B2C9AD' },
  { name: 'Lavender', hex: '#E6E6FA' },
]

const initialForm = {
  name: '', category: '', sub_category: '', description: '',
  price: '', discount_price: '',
  is_new_arrival: true, is_trending: false, is_featured: false, is_best_seller: false,
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [colors, setColors] = useState([]) // [{color, color_hex}]
  const [colorInput, setColorInput] = useState('')
  const [colorHex, setColorHex] = useState('#000000')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [extraImages, setExtraImages] = useState([]) // files
  const [extraPreviews, setExtraPreviews] = useState([]) // urls
  const [existingImages, setExistingImages] = useState([]) // from server
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const thumbRef = useRef()
  const imgsRef = useRef()

  useEffect(() => {
    categoryService.getAll().then((r) => setCategories(r.data || [])).catch(() => {})
    if (isEdit) {
      productService.getById(id).then((r) => {
        const p = r.data
        setForm({
          name: p.name || '',
          category: p.category || '',
          sub_category: p.sub_category || '',
          description: p.description || '',
          price: p.price || '',
          discount_price: p.discount_price || '',
          is_new_arrival: p.is_new_arrival,
          is_trending: p.is_trending,
          is_featured: p.is_featured,
          is_best_seller: p.is_best_seller,
        })
        setSizes(p.sizes?.map((s) => s.size) || [])
        setColors(p.colors?.map((c) => ({ color: c.color, color_hex: c.color_hex })) || [])
        setThumbnailPreview(p.thumbnail_url)
        setExistingImages(p.images || [])
      }).catch(() => toast.error('Failed to load product')).finally(() => setFetching(false))
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const toggleSize = (s) => setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const addColor = () => {
    const name = colorInput.trim()
    if (!name) return
    if (colors.find((c) => c.color.toLowerCase() === name.toLowerCase())) {
      toast.error('Color already added'); return
    }
    setColors((prev) => [...prev, { color: name, color_hex: colorHex }])
    setColorInput('')
    setColorHex('#000000')
  }

  const addPresetColor = (preset) => {
    if (colors.find((c) => c.color.toLowerCase() === preset.name.toLowerCase())) return
    setColors((prev) => [...prev, { color: preset.name, color_hex: preset.hex }])
  }

  const removeColor = (name) => setColors((prev) => prev.filter((c) => c.color !== name))

  const handleThumbnail = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleExtraImages = (e) => {
    const files = Array.from(e.target.files)
    setExtraImages((prev) => [...prev, ...files])
    setExtraPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
  }

  const removeExtraImage = (idx) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== idx))
    setExtraPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeExistingImage = async (imgId) => {
    try {
      await productService.deleteImage(id, imgId)
      setExistingImages((prev) => prev.filter((img) => img.id !== imgId))
      toast.success('Image removed')
    } catch { toast.error('Failed to remove image') }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0) e.price = 'Valid price is required'
    if (form.discount_price && (isNaN(form.discount_price) || parseFloat(form.discount_price) >= parseFloat(form.price)))
      e.discount_price = 'Discount price must be less than price'
    if (sizes.length === 0) e.sizes = 'Select at least one size'
    if (colors.length === 0) e.colors = 'Add at least one color'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error('Please fix the errors'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) formData.append(k, v)
      })
      if (thumbnail) formData.append('thumbnail', thumbnail)
      formData.append('sizes', JSON.stringify(sizes))
      formData.append('colors', JSON.stringify(colors))

      let savedProduct
      if (isEdit) {
        const res = await productService.update(id, formData)
        savedProduct = res.data
        toast.success('Product updated!')
      } else {
        const res = await productService.create(formData)
        savedProduct = res.data
        toast.success('Product created!')
      }

      // Upload extra images
      if (extraImages.length > 0) {
        const imgFormData = new FormData()
        extraImages.forEach((f) => imgFormData.append('images', f))
        await productService.uploadImages(savedProduct.id, imgFormData)
      }

      navigate('/admin/products')
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        toast.error(msgs[0] || 'Save failed')
        const newErrs = {}
        Object.entries(detail).forEach(([k, v]) => { newErrs[k] = Array.isArray(v) ? v.join(', ') : v })
        setErrors(newErrs)
      } else {
        toast.error('Save failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading product…</div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link to="/admin/products" className={styles.back}><FiArrowLeft size={18} /> Products</Link>
        <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className={styles.layout}>
          {/* ── Left column ─────────────────────────────────────────── */}
          <div className={styles.mainCol}>
            {/* Basic info */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Basic Information</h2>
              <div className={styles.grid2}>
                <div className={`form-group ${styles.span2}`}>
                  <label className="form-label">Product Name *</label>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Oversized Streetwear Tee"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="form-input">
                    <option value="">— Select Category —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sub-category (optional)</label>
                  <input
                    name="sub_category" value={form.sub_category} onChange={handleChange}
                    placeholder="e.g. Oversized, Graphic"
                    className="form-input"
                  />
                </div>

                <div className={`form-group ${styles.span2}`}>
                  <label className="form-label">Description</label>
                  <textarea
                    name="description" value={form.description} onChange={handleChange}
                    rows={4} placeholder="Describe the product…"
                    className="form-input" style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Pricing</h2>
              <div className={styles.grid2}>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    name="price" type="number" min="0" step="0.01"
                    value={form.price} onChange={handleChange}
                    placeholder="999"
                    className={`form-input ${errors.price ? 'error' : ''}`}
                  />
                  {errors.price && <span className="form-error">{errors.price}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Price (₹) <span style={{color:'#888',fontWeight:400}}>(optional)</span></label>
                  <input
                    name="discount_price" type="number" min="0" step="0.01"
                    value={form.discount_price} onChange={handleChange}
                    placeholder="799"
                    className={`form-input ${errors.discount_price ? 'error' : ''}`}
                  />
                  {errors.discount_price && <span className="form-error">{errors.discount_price}</span>}
                </div>
              </div>
              {form.price && form.discount_price && parseFloat(form.discount_price) < parseFloat(form.price) && (
                <p className={styles.savingHint}>
                  💰 Customers save ₹{(parseFloat(form.price) - parseFloat(form.discount_price)).toFixed(0)} ({Math.round(((parseFloat(form.price) - parseFloat(form.discount_price)) / parseFloat(form.price)) * 100)}% off)
                </p>
              )}
            </div>

            {/* Sizes */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Available Sizes *</h2>
              <div className={styles.sizeBtns}>
                {SIZES.map((s) => (
                  <button
                    type="button" key={s}
                    className={`${styles.sizeBtn} ${sizes.includes(s) ? styles.sizeBtnActive : ''}`}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.sizes && <span className="form-error" style={{marginTop:8,display:'block'}}>{errors.sizes}</span>}
            </div>

            {/* Colors */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Available Colors *</h2>
              <p className={styles.hint}>Click a preset or add a custom color below.</p>

              {/* Presets */}
              <div className={styles.colorPresets}>
                {COLOR_PRESETS.map((p) => (
                  <button
                    type="button" key={p.name}
                    className={`${styles.colorPreset} ${colors.find(c=>c.color===p.name) ? styles.colorPresetActive : ''}`}
                    onClick={() => addPresetColor(p)}
                    title={p.name}
                  >
                    <span className={styles.colorDot} style={{ background: p.hex }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom color */}
              <div className={styles.colorInputRow}>
                <input
                  type="color" value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className={styles.colorPicker}
                />
                <input
                  type="text" placeholder="Color name (e.g. Midnight Blue)"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className={`form-input ${styles.colorNameInput}`}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                />
                <button type="button" className={styles.addColorBtn} onClick={addColor}>
                  <FiPlus size={16} /> Add
                </button>
              </div>

              {/* Added colors */}
              {colors.length > 0 && (
                <div className={styles.addedColors}>
                  {colors.map((c) => (
                    <span key={c.color} className={styles.colorChip}>
                      <span className={styles.colorDot} style={{ background: c.color_hex }} />
                      {c.color}
                      <button type="button" onClick={() => removeColor(c.color)}>
                        <FiX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.colors && <span className="form-error" style={{marginTop:8,display:'block'}}>{errors.colors}</span>}
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────────── */}
          <div className={styles.sideCol}>
            {/* Thumbnail */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thumbnail Image</h2>
              <div className={styles.thumbUpload} onClick={() => thumbRef.current?.click()}>
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail" className={styles.thumbPreview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <FiUpload size={28} />
                    <p>Click to upload thumbnail</p>
                    <span>PNG, JPG up to 5MB</span>
                  </div>
                )}
                <input
                  type="file" accept="image/*" ref={thumbRef}
                  onChange={handleThumbnail} style={{ display: 'none' }}
                />
              </div>
              {thumbnailPreview && (
                <button
                  type="button" className={styles.removeThumb}
                  onClick={() => { setThumbnail(null); setThumbnailPreview(null) }}
                >
                  <FiX size={14} /> Remove
                </button>
              )}
            </div>

            {/* Product Images */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Product Images</h2>
              <button
                type="button" className={styles.uploadImgsBtn}
                onClick={() => imgsRef.current?.click()}
              >
                <FiUpload size={16} /> Upload Images
              </button>
              <input
                type="file" accept="image/*" multiple ref={imgsRef}
                onChange={handleExtraImages} style={{ display: 'none' }}
              />

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div className={styles.imgGrid}>
                  {existingImages.map((img) => (
                    <div key={img.id} className={styles.imgThumb}>
                      <img
                        src={img.image?.startsWith('http') ? img.image : `/media/${img.image}`}
                        alt=""
                      />
                      <button
                        type="button"
                        className={styles.removeImgBtn}
                        onClick={() => removeExistingImage(img.id)}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New images preview */}
              {extraPreviews.length > 0 && (
                <div className={styles.imgGrid}>
                  {extraPreviews.map((url, i) => (
                    <div key={url} className={styles.imgThumb}>
                      <img src={url} alt="" />
                      <button
                        type="button"
                        className={styles.removeImgBtn}
                        onClick={() => removeExtraImage(i)}
                      >
                        <FiX size={12} />
                      </button>
                      <span className={styles.newBadge}>New</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collection tags */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Collection Tags</h2>
              <div className={styles.toggleList}>
                {[
                  { name: 'is_new_arrival', label: 'New Arrival' },
                  { name: 'is_trending', label: 'Trending' },
                  { name: 'is_featured', label: 'Featured' },
                  { name: 'is_best_seller', label: 'Best Seller' },
                ].map(({ name, label }) => (
                  <label key={name} className={styles.toggle}>
                    <input
                      type="checkbox" name={name}
                      checked={form[name]} onChange={handleChange}
                    />
                    <span className={styles.toggleSlider} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className={styles.submitArea}>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
              <Link to="/admin/products" className="btn btn-outline btn-lg" style={{ width: '100%', textAlign: 'center' }}>
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
