import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - redirect to admin login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (path.startsWith('/admin') && path !== '/admin/login') {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        window.location.href = '/admin/login'
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
  update: (data) => api.patch('/core/settings/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
}

export default api
