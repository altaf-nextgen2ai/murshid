import { useState, useEffect, useRef } from 'react'
import { settingsService } from '../../services/api'
import { FiUpload, FiX, FiSave } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import styles from './AdminSettings.module.css'

export default function AdminSettings() {
  const [form, setForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    whatsapp_number: '',
  })
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [existingLogo, setExistingLogo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const logoRef = useRef()

  useEffect(() => {
    settingsService.get()
      .then((r) => {
        const d = r.data
        setForm({
          business_name: d.business_name || '',
          business_email: d.business_email || '',
          business_phone: d.business_phone || '',
          business_address: d.business_address || '',
          whatsapp_number: d.whatsapp_number || '',
        })
        setExistingLogo(d.logo_url || null)
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return }
    setLogo(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.business_name.trim()) { toast.error('Business name is required'); return }
    if (form.whatsapp_number && !/^\d{10,15}$/.test(form.whatsapp_number.replace(/\D/g, ''))) {
      toast.error('WhatsApp number should be 10-15 digits (include country code, e.g. 917042129273)')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (logo) fd.append('logo', logo)

      const res = await settingsService.update(fd)
      setExistingLogo(res.data.logo_url || existingLogo)
      setLogo(null)
      setLogoPreview(null)
      toast.success('Settings saved!')
    } catch (err) {
      const msg = err.response?.data
      if (typeof msg === 'object') {
        toast.error(Object.values(msg).flat()[0] || 'Save failed')
      } else {
        toast.error('Save failed')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading settings…</div>
  )

  const waPreview = form.whatsapp_number
    ? `https://wa.me/${form.whatsapp_number}?text=Hi!`
    : null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Configure your store details, WhatsApp number, and branding.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className={styles.layout}>
          {/* ── Main column ─── */}
          <div className={styles.mainCol}>

            {/* Business Info */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Business Information</h2>
              <div className={styles.grid2}>
                <div className={`form-group ${styles.span2}`}>
                  <label className="form-label">Business Name *</label>
                  <input
                    name="business_name" value={form.business_name}
                    onChange={handleChange} placeholder="Murshid"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Email</label>
                  <input
                    name="business_email" type="email" value={form.business_email}
                    onChange={handleChange} placeholder="admin@yourstore.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Phone</label>
                  <input
                    name="business_phone" value={form.business_phone}
                    onChange={handleChange} placeholder="+91 70421 29273"
                    className="form-input"
                  />
                </div>

                <div className={`form-group ${styles.span2}`}>
                  <label className="form-label">Business Address</label>
                  <textarea
                    name="business_address" value={form.business_address}
                    onChange={handleChange} rows={3}
                    placeholder="Mumbai, Maharashtra, India"
                    className="form-input" style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className={styles.card}>
              <div className={styles.waHeader}>
                <div>
                  <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>WhatsApp Configuration</h2>
                  <p className={styles.hint}>
                    This number is used for all WhatsApp order links across the website.
                    Include country code — e.g. <code>917042129273</code> for India.
                  </p>
                </div>
                <FaWhatsapp size={32} color="#25D366" />
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">WhatsApp Number</label>
                <div className={styles.waInputRow}>
                  <FaWhatsapp size={18} color="#25D366" className={styles.waIcon} />
                  <input
                    name="whatsapp_number" value={form.whatsapp_number}
                    onChange={handleChange}
                    placeholder="917042129273"
                    className={`form-input ${styles.waInput}`}
                  />
                </div>
                <span className={styles.waHelp}>
                  No spaces, dashes, or + symbol. Example: 917042129273
                </span>
              </div>

              {waPreview && (
                <div className={styles.waPreview}>
                  <p className={styles.waPreviewLabel}>Preview link:</p>
                  <a href={waPreview} target="_blank" rel="noopener noreferrer" className={styles.waPreviewLink}>
                    {waPreview}
                  </a>
                  <a href={waPreview} target="_blank" rel="noopener noreferrer" className={styles.testWaBtn}>
                    <FaWhatsapp size={14} /> Test WhatsApp Link
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ── Side column ─── */}
          <div className={styles.sideCol}>
            {/* Logo */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Brand Logo</h2>
              <div
                className={styles.logoUpload}
                onClick={() => logoRef.current?.click()}
              >
                {logoPreview || existingLogo ? (
                  <img
                    src={logoPreview || existingLogo}
                    alt="Logo"
                    className={styles.logoPreview}
                  />
                ) : (
                  <div className={styles.logoPlaceholder}>
                    <FiUpload size={24} />
                    <p>Upload Logo</p>
                    <span>PNG or JPG, max 5MB</span>
                  </div>
                )}
                <input
                  type="file" accept="image/*" ref={logoRef}
                  onChange={handleLogo} style={{ display: 'none' }}
                />
              </div>

              {(logoPreview || existingLogo) && (
                <div className={styles.logoActions}>
                  <button
                    type="button" className={styles.changeLogoBtn}
                    onClick={() => logoRef.current?.click()}
                  >
                    <FiUpload size={13} /> Change Logo
                  </button>
                  {logoPreview && (
                    <button
                      type="button" className={styles.removeLogoBtn}
                      onClick={() => { setLogo(null); setLogoPreview(null) }}
                    >
                      <FiX size={13} /> Discard
                    </button>
                  )}
                </div>
              )}

              <p className={styles.logoHint}>
                Used in navbar, footer, invoices, and emails.
                Recommended: square image, min 200×200px.
              </p>
            </div>

            {/* Save */}
            <div className={styles.saveCard}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                {saving ? 'Saving…' : <><FiSave size={16} /> Save Settings</>}
              </button>
              {saving && <p className={styles.savingNote}>Uploading changes…</p>}
            </div>

            {/* Info card */}
            <div className={styles.infoCard}>
              <h4>💡 Quick Tips</h4>
              <ul>
                <li>WhatsApp number must include country code (no + symbol).</li>
                <li>The business email receives all new order notifications.</li>
                <li>Your logo appears on all customer-facing pages and invoices.</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
