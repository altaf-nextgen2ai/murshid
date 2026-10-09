import { useState, useEffect } from 'react'
import { categoryService } from '../../services/api'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import styles from './AdminCategories.module.css'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', parent: '' })
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    categoryService.getAll()
      .then((r) => setCategories(r.data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ name: '', parent: '' }); setEditingId(null); setShowForm(true) }

  const openEdit = (cat) => {
    setForm({ name: cat.name, parent: cat.parent || '' })
    setEditingId(cat.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return }
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), parent: form.parent || null }
      if (editingId) {
        await categoryService.update(editingId, payload)
        toast.success('Category updated!')
      } else {
        await categoryService.create(payload)
        toast.success('Category created!')
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await categoryService.delete(id)
      toast.success('Category deleted')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Cannot delete — it may have products assigned')
    }
  }

  // Flatten for table (top-level + children)
  const flatCategories = []
  categories.forEach((cat) => {
    flatCategories.push({ ...cat, isChild: false })
    ;(cat.children || []).forEach((child) => flatCategories.push({ ...child, isChild: true }))
  })

  const topLevel = categories.filter((c) => !c.parent)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Categories</h1>
          <p>{flatCategories.length} categories</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <FiPlus size={16} /> Add Category
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Parent</th>
              <th>Sub-categories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {[...Array(4)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            ) : flatCategories.length === 0 ? (
              <tr><td colSpan={4} className={styles.empty}>No categories yet. Add one!</td></tr>
            ) : (
              flatCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <span className={cat.isChild ? styles.childName : styles.parentName}>
                      {cat.isChild && <span className={styles.childArrow}>└ </span>}
                      {cat.name}
                    </span>
                  </td>
                  <td>{cat.parent_name || <span className={styles.muted}>—</span>}</td>
                  <td>
                    {!cat.isChild && cat.children?.length > 0 ? (
                      <div className={styles.subList}>
                        {cat.children.map((c) => (
                          <span key={c.id} className={styles.subTag}>{c.name}</span>
                        ))}
                      </div>
                    ) : <span className={styles.muted}>—</span>}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(cat)} title="Edit">
                        <FiEdit2 size={14} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => setDeleteId(cat.id)} title="Delete">
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Edit Category' : 'Add Category'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}><FiX size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Category Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Men, Women, Kids"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Category <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label>
                <select
                  className="form-input"
                  value={form.parent}
                  onChange={(e) => setForm((p) => ({ ...p, parent: e.target.value }))}
                >
                  <option value="">— Top Level Category —</option>
                  {topLevel.filter((c) => c.id !== editingId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : <><FiCheck size={14} /> {editingId ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className={styles.modal}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Delete Category?</h3>
              <button className={styles.closeBtn} onClick={() => setDeleteId(null)}><FiX size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#666', fontSize: 14 }}>
                This will delete the category. Products assigned to it will be unlinked.<br />
                This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className={`btn btn-sm ${styles.dangerBtn}`} onClick={() => handleDelete(deleteId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
