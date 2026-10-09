import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// ── Request interceptor: attach JWT only when one exists ─────────────────────
api.interceptors.request.use((config) => {
  // Admin token takes priority
  const adminToken = localStorage.getItem('adminToken')
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
    return config
  }

  // Customer token — parse carefully; a corrupt value must not be sent
  try {
    const raw = localStorage.getItem('customerUser')
    if (raw) {
      const parsed = JSON.parse(raw)
      const token = parsed?.token
      // Only attach if it looks like a JWT (three base64 segments)
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch {
    // JSON.parse failed — stale/corrupt entry; leave it; don't attach anything
  }

  return config
})

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const path = window.location.pathname

    if (status === 401) {
      if (path.startsWith('/admin') && path !== '/admin/login') {
        // Admin session expired — clear and redirect
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        window.location.href = '/admin/login'
      }
      // For customer routes: clear a stale customerUser token silently.
      // Don't redirect — the page just shows logged-out state.
      // Only do this if the failed request was NOT the google-login endpoint
      // itself (that 401 means bad credential, not a stale session).
      const url = error.config?.url || ''
      if (!url.includes('/auth/') && !path.startsWith('/admin')) {
        try {
          const raw = localStorage.getItem('customerUser')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.token) {
              // Token is rejected by server — clear it so future requests
              // go out unauthenticated and hit the public permission class
              localStorage.removeItem('customerUser')
              console.warn('[Auth] Stale customer token cleared after 401.')
            }
          }
        } catch {
          localStorage.removeItem('customerUser')
        }
      }
    }

    return Promise.reject(error)
  }
)

// ── Products ──────────────────────────────────────────────────────────────────
export const productService = {
  getAll: (params = {}) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}/`),
  getRelated: (id) => api.get(`/products/${id}/related/`),
  create: (data) => api.post('/products/create/', data),
  update: (id, data) => api.patch(`/products/${id}/edit/`, data),
  delete: (id) => api.delete(`/products/${id}/edit/`),
  uploadImages: (productId, formData) =>
    api.post(`/products/${productId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (productId, imageId) =>
    api.delete(`/products/${productId}/images/${imageId}/`),
  adminList: (params = {}) => api.get('/products/admin/list/', { params }),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryService = {
  getAll: () => api.get('/products/categories/all/'),
  getTopLevel: () => api.get('/products/categories/'),
  create: (data) => api.post('/products/categories/', data),
  update: (id, data) => api.patch(`/products/categories/${id}/`, data),
  delete: (id) => api.delete(`/products/categories/${id}/`),
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderService = {
  create: (data) => api.post('/orders/create/', data),
  getByOrderNumber: (orderNumber) => api.get(`/orders/${orderNumber}/`),
  getMyOrders: (params = {}) => api.get('/orders/my-orders/', { params }),
  adminList: (params = {}) => api.get('/orders/admin/list/', { params }),
  adminGetById: (id) => api.get(`/orders/admin/${id}/`),
  updateStatus: (id, data) => api.patch(`/orders/admin/${id}/status/`, data),
  sendInvoice: (id) => api.post(`/orders/admin/${id}/send-invoice/`),
  getStats: () => api.get('/orders/admin/stats/summary/'),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerService = {
  getAll: () => api.get('/customers/'),
  getById: (id) => api.get(`/customers/${id}/`),
  getOrders: (id) => api.get(`/customers/${id}/orders/`),
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsService = {
  get: () => api.get('/core/settings/'),
  update: (data) =>
    api.patch('/core/settings/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login: (credentials) => api.post('/auth/login/', credentials),
  googleLogin: (data) => api.post('/auth/google-login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
}

export default api
