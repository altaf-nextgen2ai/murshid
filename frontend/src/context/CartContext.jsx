import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('murshid_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('murshid_cart', JSON.stringify(items))
  }, [items])

  const addItem = (product, size, color, quantity = 1) => {
    const key = `${product.id}-${size}-${color}`
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        toast.success('Cart updated!')
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      toast.success('Added to cart!')
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          thumbnail: (() => {
            const raw = product.thumbnail_url || product.thumbnail
            if (!raw) return null
            if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
            if (raw.startsWith('/media/')) return raw
            if (raw.startsWith('media/')) return `/${raw}`
            return `/media/${raw}`
          })(),
          price: parseFloat(product.price),
          discountPrice: product.discount_price ? parseFloat(product.discount_price) : null,
          size,
          color,
          quantity,
        },
      ]
    })
  }

  const updateQuantity = (key, quantity) => {
    if (quantity < 1) return
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }

  const removeItem = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
    toast.success('Removed from cart')
  }

  const clearCart = () => setItems([])

  const subtotal = items.reduce((sum, item) => {
    const price = item.discountPrice ?? item.price
    return sum + price * item.quantity
  }, 0)

  const originalTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const savings = originalTotal - subtotal
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      originalTotal,
      savings,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
