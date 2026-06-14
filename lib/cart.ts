export interface CartItem {
  id: string
  name: string
  price: number
  emoji: string
  image_url?: string
  quantity: number
}

export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch { return [] }
}

export const addToCart = (item: Omit<CartItem, 'quantity'>) => {
  const cart = getCart()
  const existing = cart.find(i => i.id === item.id)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }
  localStorage.setItem('cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export const removeFromCart = (id: string) => {
  const cart = getCart().filter(i => i.id !== id)
  localStorage.setItem('cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export const updateQuantity = (id: string, quantity: number) => {
  const cart = getCart().map(i => i.id === id ? { ...i, quantity } : i)
  localStorage.setItem('cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export const clearCart = () => {
  localStorage.setItem('cart', '[]')
  window.dispatchEvent(new Event('cartUpdated'))
}

export const getCartCount = (): number => {
  return getCart().reduce((sum, i) => sum + i.quantity, 0)
}